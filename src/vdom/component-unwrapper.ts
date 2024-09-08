import { EventHandler, VdomEventType } from '../dom/events/event.types';
import {
  AnyObject,
  ComponentFunc,
  ComponentResult,
  ComponentUnwrapperContext,
  Injection,
  TagAttr,
  VdomNode,
  VdomNodeType,
  VdomUnwrapperContext,
} from './vdom.types';

import {
  AstNode,
  AstNodeType,
  EventAttr,
  InterStr,
  PropAttr,
  StrAttr,
  StrPtr,
  Var,
} from '../ast/parser/parser.types';
import { Logger } from '../log/logger';
import { VdomUnwrapper } from './vdom-unwrapper';

export class ComponentUnwrapper {
  constructor(
    private readonly level: number,
    private readonly root: AstNode,
    private readonly dest: VdomNode[],
    private readonly logger: Logger,
    private readonly context: ComponentUnwrapperContext,
    private readonly vdomUnwrapper: VdomUnwrapper,
  ) {}

  public tryUnwrap(): boolean {
    if (!this.root.children) {
      throw new Error('Incomplete root node');
    }
    return this.tryUnwrapBasicTag(this.root.children[0], this.dest, false);
  }

  private tryUnwrapNode(node: AstNode, dest: VdomNode[]): boolean {
    switch (node.type) {
      case 'Bt':
        return this.tryUnwrapBasicTag(node, dest, false);
      case 'Fr':
        return this.tryUnwrapForTag(node, dest);
      case 'If':
        return this.tryUnwrapIfTag(node, dest);
      case 'Gt':
        return this.tryUnwrapGenericTag(node, dest, false);
      case 'Cp':
        return this.tryUnwrapCompTag(node, dest, [], false);
      case 'Gc':
        return this.tryUnwrapGenericCompTag(node, dest, [], false);
      case 'Ij':
        return this.tryUnwrapInjectTag(node, dest, []);
      case 'Ch':
        return this.tryUnwrapChildrenTag(node, dest);
      case 'Tx':
        return this.tryUnwrapText(node, dest);
      default:
        throw new Error('Unsupported node type');
    }
  }

  private tryUnwrapBasicTag(
    tag: AstNode,
    dest: VdomNode[],
    demandKey: boolean,
  ): boolean {
    if (
      !tag.id ||
      !tag.tagArgs ||
      !tag.children ||
      (demandKey && !tag.key)
    ) {
      throw new Error('Incomplete basic tag');
    }
    let res = true;

    const vnode: VdomNode = {
      type: 'Tag',
      tag: tag.id.str,
      key: tag.key,
      attrs: [],
      eventsMap: new Map(),
      children: [],
    };

    res = this.tryGetTagAttrs(tag.tagArgs.attrs, vnode.attrs!) && res;
    res = this.tryGetEventsMap(tag.tagArgs.events, vnode.eventsMap!) && res;

    for (let i = 0; i < tag.children.length; i++) {
      res = this.tryUnwrapNode(tag.children[i], vnode.children!) && res;
    }
    if (res) dest.push(vnode);
    return res;
  }

  private tryUnwrapForTag(tag: AstNode, dest: VdomNode[]): boolean {
    if (!tag.id || !tag.loop || !tag.children) {
      throw new Error('Incomplete for tag');
    }
    let res = true;
    const vnode: VdomNode = {
      type: 'List',
      children: [],
    };

    const items: unknown = this.getVar(tag.loop.items);

    if (!Array.isArray(items)) {
      this.logger.error(
        tag.loop.items.at(-1)!.pos,
        'The value must be an array',
      );
      return false;
    }

    const alias = tag.loop.alias.str;

    if (this.context.attachMap.has(alias)) {
      this.logger.error(
        tag.loop.alias.pos,
        'The property already exists in attachments',
      );
      return false;
    }

    for (let i = 0; i < items.length; i++) {
      this.context.attachMap.set(alias, i);

      switch (tag.children[i].type) {
        case 'Bt':
          res =
            this.tryUnwrapBasicTag(
              tag.children[0]!,
              vnode.children!,
              true,
            ) && res;
          break;
        case 'Gt':
          res =
            this.tryUnwrapGenericTag(
              tag.children[0]!,
              vnode.children!,
              true,
            ) && res;
          break;
        case 'Cp':
          res =
            this.tryUnwrapCompTag(
              tag.children[0]!,
              vnode.children!,
              [],
              true,
            ) && res;
          break;
        case 'Gc':
          res =
            this.tryUnwrapGenericCompTag(
              tag.children[0]!,
              vnode.children!,
              [],
              true,
            ) && res;
          break;
        default:
          throw new Error('Invalid tag type inside loop');
      }
    }
    this.context.attachMap.delete(alias);

    if (res) dest.push(vnode);
    return res;
  }

  private tryUnwrapIfTag(tag: AstNode, dest: VdomNode[]): boolean {
    if (!tag.id || !tag.condition || !tag.children) {
      throw new Error('Incomplete if tag');
    }

    let condition: unknown = this.getVar(tag.condition.predicate);
    if (typeof condition !== 'boolean') {
      this.logger.error(
        tag.condition.predicate.at(-1)!.pos,
        `The value must be a boolean, got ${typeof condition}`,
      );
      return false;
    }

    condition = tag.condition.invert ? !condition : condition;

    let res = true;

    const skip = (node: AstNode) => {
      if (!node.children) {
        return;
      }
      if (node.type === 'Cp') {
        res = this.trySkipCompTag(node) && res;
        return;
      }
      if (node.type === 'Gc') {
        res = this.trySkipGenericCompTag(node) && res;
        return;
      }
      node.children.forEach((c: AstNode) => skip(c));
    };

    if (!condition) {
      skip(tag.children[0]);

      const blank: VdomNode = { type: 'Blank' };
      if (res) dest.push(blank);
      return res;
    }

    switch (tag.children[0].type) {
      case 'Bt':
        res = this.tryUnwrapBasicTag(tag.children[0]!, dest, true) && res;
        break;
      case 'Gt':
        res = this.tryUnwrapGenericTag(tag.children[0]!, dest, true) && res;
        break;
      case 'Cp':
        res =
          this.tryUnwrapCompTag(tag.children[0]!, dest, [], true) && res;
        break;
      case 'Gc':
        res =
          this.tryUnwrapGenericCompTag(tag.children[0]!, dest, [], true) &&
          res;
        break;
      default:
        throw new Error('Invalid tag type inside if tag');
    }
    return res;
  }

  private tryUnwrapGenericTag(
    tag: AstNode,
    dest: VdomNode[],
    demandKey: boolean,
  ): boolean {
    if (
      !tag.id ||
      !tag.tagName ||
      !tag.tagArgs ||
      !tag.children ||
      (demandKey && !tag.key)
    ) {
      throw new Error('Incomplete generic tag');
    }
    let res = true;
    const tagName: unknown = this.getVar(tag.tagName);

    if (typeof tagName !== 'string') {
      this.logger.error(tag.tagName.at(-1)!.pos, 'Tag id must be a string');
      return false;
    }

    const vnode: VdomNode = {
      type: 'Tag',
      tag: tagName,
      attrs: [],
      eventsMap: new Map(),
      children: [],
    };

    res = this.tryGetTagAttrs(tag.tagArgs.attrs, vnode.attrs!) && res;
    res = this.tryGetEventsMap(tag.tagArgs.events, vnode.eventsMap!) && res;

    for (let i = 0; i < tag.children.length; i++) {
      res = this.tryUnwrapNode(tag.children[i], vnode.children!) && res;
    }
    if (res) dest.push(vnode);
    return res;
  }

  private tryUnwrapCompTag(
    tag: AstNode,
    dest: VdomNode[],
    injections: Injection[],
    demandKey: boolean,
  ): boolean {
    if (!tag.id || !tag.props || !tag.children || (demandKey && !tag.key)) {
      throw new Error('Incomplete component tag');
    }

    let res = true;
    const func: ComponentFunc | undefined = this.context.importsMap.get(
      tag.id.str,
    );

    if (!func) {
      this.logger.error(
        tag.id.pos,
        'Cannot find the component function in imports',
      );
      return false;
    } else if (typeof func !== 'function' || func.length !== 1) {
      this.logger.error(
        tag.id.pos,
        `Expected a component function, got ${typeof func}`,
      );
      return false;
    }

    const ctx: VdomUnwrapperContext = {
      componentId: func.name,
      func: func as ComponentFunc,
      props: {},
      injections,
      unwrapChildren: undefined,
    };

    res = this.tryGetProps(tag.props, ctx.props) && res;

    const tagChildren = tag.children;

    if (tagChildren.length > 0) {
      ctx.unwrapChildren = (dest: VdomNode[]) => {
        let success = true;

        for (let i = 0; i < tagChildren.length; i++) {
          success = this.tryUnwrapNode(tagChildren[i], dest) && success;
        }
        return success;
      };
    }

    if (res) this.vdomUnwrapper.unwrapComponent(dest, ctx, this.level + 1);
    return res;
  }

  private tryUnwrapGenericCompTag(
    tag: AstNode,
    dest: VdomNode[],
    injections: Injection[],
    demandKey: boolean,
  ): boolean {
    if (
      !tag.id ||
      !tag.props ||
      !tag.children ||
      !tag.compFunc ||
      (demandKey && !tag.key)
    ) {
      throw new Error('Incomplete generic component tag');
    }

    let res = true;
    const func: unknown = this.getVar(tag.compFunc);

    if (!func) {
      this.logger.error(
        tag.id.pos,
        'Cannot find the component function in attachemnts',
      );
      return false;
    } else if (typeof func !== 'function' || func.length !== 1) {
      this.logger.error(
        tag.id.pos,
        `Expected a component function, got ${typeof func}`,
      );
      return false;
    }

    const ctx: VdomUnwrapperContext = {
      componentId: func.name,
      func: func as ComponentFunc,
      props: {},
      injections,
      unwrapChildren: undefined,
    };

    res = this.tryGetProps(tag.props, ctx.props) && res;

    const tagChildren = tag.children;

    if (tagChildren.length > 0) {
      ctx.unwrapChildren = (dest: VdomNode[]) => {
        let success = true;

        for (let i = 0; i < tagChildren.length; i++) {
          success = this.tryUnwrapNode(tagChildren[i], dest) && success;
        }
        return success;
      };
    }

    if (res) this.vdomUnwrapper.unwrapComponent(dest, ctx, this.level + 1);
    return res;
  }

  private tryUnwrapInjectTag(
    tag: AstNode,
    dest: VdomNode[],
    injections: Injection[],
  ): boolean {
    if (!tag.id || !tag.injection || !tag.children) {
      throw new Error('Incomplete injection tag');
    }

    let res = true;

    const value: unknown = this.getVar(tag.injection.value);

    if (!value) {
      this.logger.error(
        tag.injection.value.at(-1)!.pos,
        'Cannot find context value in attachments',
      );
      return false;
    }

    const contextKey: unknown = this.getVar(tag.injection.contextKey);

    if (!contextKey) {
      this.logger.error(
        tag.injection.contextKey.at(-1)!.pos,
        'Cannot find context key in attachments',
      );
      return false;
    } else if (typeof contextKey !== 'string') {
      this.logger.error(
        tag.injection.contextKey.at(-1)!.pos,
        'Context key should be a string',
      );
      return false;
    }

    injections.push({ contextKey, value });

    switch (tag.children[0]!.type) {
      case 'Cp':
        res =
          this.tryUnwrapCompTag(
            tag.children[0]!,
            dest,
            injections,
            false,
          ) && res;
        return res;
      case 'Gc':
        res =
          this.tryUnwrapGenericCompTag(
            tag.children[0]!,
            dest,
            injections,
            false,
          ) && res;
        return res;
      case 'Ij':
        res =
          this.tryUnwrapInjectTag(tag.children[0]!, dest, injections) &&
          res;
        return res;
      default:
        throw new Error('Invalid tag inside injection tag');
    }
  }

  private tryUnwrapChildrenTag(tag: AstNode, dest: VdomNode[]): boolean {
    if (!tag.id) {
      throw new Error('Incomplete children tag');
    }
    if (this.context.unwrapChildren) {
      return this.context.unwrapChildren(dest);
    }
    return true;
  }

  private tryUnwrapText(tag: AstNode, dest: VdomNode[]): boolean {
    if (!tag.text) {
      throw new Error('Incomplete text node');
    }
    const node: VdomNode = {
      type: 'Text',
      text: this.getText(tag.text),
    };
    dest.push(node);
    return true;
  }

  private trySkipCompTag(tag: AstNode): boolean {
    if (!tag.id || !tag.props || !tag.children) {
      throw new Error('Incomplete component tag');
    }

    const res = true;
    const func: ComponentFunc | undefined = this.context.importsMap.get(
      tag.id.str,
    );

    if (!func) {
      this.logger.error(
        tag.id.pos,
        'Cannot find the component function in imports',
      );
      return false;
    } else if (typeof func !== 'function' || func.length !== 1) {
      this.logger.error(
        tag.id.pos,
        `Expected a component function, got ${typeof func}`,
      );
      return false;
    }
    if (res) this.vdomUnwrapper.skipComponent(func.name, this.level + 1);
    return res;
  }

  private trySkipGenericCompTag(tag: AstNode): boolean {
    if (!tag.id || !tag.props || !tag.children || !tag.compFunc) {
      throw new Error('Incomplete generic component tag');
    }

    const res = true;
    const func: unknown = this.getVar(tag.compFunc);

    if (!func) {
      this.logger.error(
        tag.id.pos,
        'Cannot find the component function in attachemnts',
      );
      return false;
    } else if (typeof func !== 'function' || func.length !== 1) {
      this.logger.error(
        tag.id.pos,
        `Expected a component function, got ${typeof func}`,
      );
      return false;
    }

    if (res) this.vdomUnwrapper.skipComponent(func.name, this.level + 1);
    return res;
  }

  private tryGetProps(tagProps: PropAttr[], dest: AnyObject): boolean {
    for (let i = 0; i < tagProps.length; i++) {
      const prop: PropAttr = tagProps[i];

      if (prop.isSpread) {
        if (!prop.value) {
          throw new Error('Incomplete spread property');
        }
        const value: unknown = this.getVar(prop.value);

        if (typeof value !== 'object' || value === null) {
          this.logger.error(
            prop.value.at(-1)!.pos,
            'The spread prop value must be an object',
          );
          return false;
        }
        dest = { ...dest, ...value };
        continue;
      }
      const name: string = prop.prop;

      if (prop.strValue) {
        dest[name] = this.getText(prop.strValue);
        continue;
      }
      if (!prop.value) {
        throw new Error('Incomplete property');
      }
      dest[name] = this.getVar(prop.value);
    }
    return true;
  }

  private tryGetTagAttrs(attrs: StrAttr[], dest: TagAttr[]): boolean {
    for (let i = 0; i < attrs.length; i++) {
      dest.push({
        id: attrs[i].attr,
        value: this.getText(attrs[i].strValue),
      });
    }
    return true;
  }

  private tryGetEventsMap(
    events: EventAttr[],
    dest: Map<VdomEventType, EventHandler>,
  ): boolean {
    for (let i = 0; i < events.length; i++) {
      const handler: unknown = this.getVar(events[i].handler);

      if (!handler) {
        this.logger.error(
          events[i].handler.at(-1)!.pos,
          'Cannot find event handler in attachments',
        );
        return false;
      } else if (typeof handler !== 'function' || handler.length !== 1) {
        this.logger.error(
          events[i].handler.at(-1)!.pos,
          `Expected an event handler, got ${typeof handler}`,
        );
        return false;
      }
      dest.set(events[i].event, handler as EventHandler);
    }
    return true;
  }

  private getText(interStr: InterStr): string {
    let str = '';

    for (let i = 0; i < interStr.length; i++) {
      const chunk: StrPtr | Var = interStr[i];

      if ('str' in chunk) {
        str += chunk.str;
        continue;
      }
      const value: unknown = this.getVar(chunk);

      switch (typeof value) {
        case 'object':
          str += '{object}';
          continue;
        case 'function':
          str += '{function}';
          continue;
        default:
          str += value;
          continue;
      }
    }
    return str;
  }

  private getVar(value: Var): unknown {
    let result: unknown = this.context.attachMap.get(value[0].str);

    if (value.length === 1) {
      return result;
    }

    for (let i = 1; i < value.length; i++) {
      if (!result) {
        this.logger.error(
          value[i - 1].pos,
          'The value seems to be undefined',
        );
        return result;
      }
      result = (result as AnyObject)[value[i].str];
    }
    return result;
  }
}

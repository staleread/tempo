import { EventHandler, VdomEventType } from '../dom/events/event.types';
import {
  AnyObject,
  ComponentFunc,
  ComponentResult,
  ComponentUnwrapperContext,
  ComponentUnwrapperDto,
  Injection,
  TagAttr,
  VdomNode,
  VdomNodeType,
} from './vdom.types';

import {
  AstNode,
  AstNodeType,
  ConditionArgs,
  EventAttr,
  InjectionArg,
  InterStr,
  KeymapArgs,
  PropAttr,
  StrAttr,
  StrPtr,
  TagArgs,
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
    return this.tryUnwrapTagLikeTag(
      this.root.children[0],
      this.dest,
      false,
    );
  }

  private tryUnwrapNode(node: AstNode, dest: VdomNode[]): boolean {
    switch (node.type) {
      case 'Bt':
        return this.tryUnwrapTagLikeTag(node, dest, false);
      case 'Gt':
        return this.tryUnwrapTagLikeTag(node, dest, false);
      case 'Cp':
        return this.tryUnwrapCompTag(node, dest, false);
      case 'Gc':
        return this.tryUnwrapGenericCompTag(node, dest, false);
      case 'Ch':
        return this.tryUnwrapChildrenTag(dest);
      case 'Tx':
        return this.tryUnwrapText(node, dest);
      default:
        throw new Error('Unsupported node type');
    }
  }

  private tryUnwrapTagLikeTag(
    tag: AstNode,
    dest: VdomNode[],
    skipCommands: boolean,
  ): boolean {
    let res = true;

    if (tag.keymapArgs && !skipCommands) {
      return this.tryUnwrapTagWithKeymap(tag, dest);
    }
    if (tag.condition && !skipCommands) {
      return this.tryUnwrapTagWithCondition(tag, dest);
    }

    const node: VdomNode = {
      type: 'Tag',
      attrs: [],
      eventsMap: new Map(),
      children: [],
    };

    if (tag.type === 'Gt') {
      const tagName: unknown = this.getVar(tag.tagName!);

      if (typeof tagName !== 'string') {
        this.logger.error(
          tag.tagName!.at(-1)!.pos,
          'Tag id must be a string',
        );
        return false;
      }
      node.tag = tagName;
    } else {
      node.tag = tag.id!.str;
    }

    if (skipCommands && tag.keymapArgs?.key) {
      const key: unknown = this.getVar(tag.keymapArgs.key);

      if (typeof key !== 'string' && typeof key !== 'number') {
        this.logger.error(
          tag.keymapArgs.key.at(-1)!.pos,
          'Unsupported value for a key',
        );
        return false;
      }
      node.key = key;
    }

    res = this.tryGetTagAttrs(tag.tagArgs!.attrs, node.attrs!) && res;
    res = this.tryGetEventsMap(tag.tagArgs!.events, node.eventsMap!) && res;

    for (let i = 0; i < tag.children!.length; i++) {
      res = this.tryUnwrapNode(tag.children![i], node.children!) && res;
    }
    if (res) dest.push(node);
    return res;
  }

  private tryUnwrapCompTag(
    tag: AstNode,
    dest: VdomNode[],
    skipCommands: boolean,
  ): boolean {
    if (tag.keymapArgs && !skipCommands) {
      return this.tryUnwrapTagWithKeymap(tag, dest);
    }
    if (tag.condition && !skipCommands) {
      return this.tryUnwrapTagWithCondition(tag, dest);
    }

    let res = true;
    const func: ComponentFunc | undefined = this.context.importsMap.get(
      tag.id!.str,
    );

    if (!func) {
      this.logger.error(
        tag.id!.pos,
        'Cannot find the component function in imports',
      );
      return false;
    } else if (typeof func !== 'function' || func.length !== 1) {
      this.logger.error(
        tag.id!.pos,
        `Expected a component function, got ${typeof func}`,
      );
      return false;
    }

    const dto: ComponentUnwrapperDto = {
      level: this.level + 1,
      dest,
      componentId: func.name,
      func: func as ComponentFunc,
      props: {},
      unwrapChildren: undefined,
    };

    res = this.tryGetProps(tag.props!, dto.props) && res;

    const injections: Injection[] = [];

    if (tag.injections) {
      res = this.tryGetInjections(tag, injections);
    }

    const tagChildren = tag.children!;

    if (tagChildren.length > 0) {
      dto.unwrapChildren = (dest: VdomNode[]) => {
        let success = true;

        for (let i = 0; i < tagChildren.length; i++) {
          success = this.tryUnwrapNode(tagChildren[i], dest) && success;
        }
        return success;
      };
    }

    if (res) this.vdomUnwrapper.unwrapComponent(dto, injections);
    return res;
  }

  private tryUnwrapGenericCompTag(
    tag: AstNode,
    dest: VdomNode[],
    skipCommands: boolean,
  ): boolean {
    if (tag.condition && !skipCommands) {
      return this.tryUnwrapTagWithCondition(tag, dest);
    }

    let res = true;

    const func: unknown = this.getVar(tag.compFunc!);

    if (!func) {
      this.logger.error(
        tag.id!.pos,
        'Cannot find the component function in attachemnts',
      );
      return false;
    } else if (typeof func !== 'function' || func.length !== 1) {
      this.logger.error(
        tag.id!.pos,
        `Expected a component function, got ${typeof func}`,
      );
      return false;
    }

    const node: VdomNode = {
      type: 'Generic',
      componentId: func.name,
      children: [],
    };

    const dto: ComponentUnwrapperDto = {
      level: this.level + 1,
      dest: node.children!,
      componentId: func.name,
      func: func as ComponentFunc,
      props: {},
      unwrapChildren: undefined,
    };

    res = this.tryGetProps(tag.props!, dto.props) && res;

    const injections: Injection[] = [];

    if (tag.injections) {
      res = this.tryGetInjections(tag, injections);
    }

    const tagChildren = tag.children!;

    if (tagChildren.length > 0) {
      dto.unwrapChildren = (dest: VdomNode[]) => {
        let success = true;

        for (let i = 0; i < tagChildren.length; i++) {
          success = this.tryUnwrapNode(tagChildren[i], dest) && success;
        }
        return success;
      };
    }

    if (res) {
      this.vdomUnwrapper.unwrapComponent(dto, injections);
      dest.push(node);
    }
    return res;
  }

  private tryUnwrapTagWithKeymap(tag: AstNode, dest: VdomNode[]): boolean {
    let res = true;

    const node: VdomNode = {
      type: 'Keymap',
      domElemMap: new Map(),
      children: [],
    };

    const alias = tag.keymapArgs!.alias.str;

    if (this.context.attachMap.has(alias)) {
      this.logger.error(
        tag.keymapArgs!.alias.pos,
        'The property already exists in attachments',
      );
      return false;
    }

    const items: unknown = this.getVar(tag.keymapArgs!.items);

    if (!Array.isArray(items)) {
      this.logger.error(
        tag.keymapArgs!.items.at(-1)!.pos,
        'The keymaps items must be an array',
      );
      return false;
    }

    for (let i = 0; i < items.length; i++) {
      this.context.attachMap.set(alias, items[i]);
      if (tag.type === 'Bt') {
        res = this.tryUnwrapTagLikeTag(tag, node.children!, true);
        continue;
      }
      res = this.tryUnwrapCompTag(tag, node.children!, true);
    }
    this.context.attachMap.delete(alias);

    if (res) dest.push(node);
    return res;
  }

  private tryUnwrapTagWithCondition(
    tag: AstNode,
    dest: VdomNode[],
  ): boolean {
    let res = true;

    let predicate: boolean = !!this.getVar(tag.condition!.predicate);
    predicate = tag.condition!.invert ? !predicate : predicate;

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

    if (predicate) {
      switch (tag.type) {
        case 'Bt':
        case 'Gt':
          return this.tryUnwrapTagLikeTag(tag, dest, true);
        case 'Cp':
          return this.tryUnwrapCompTag(tag, dest, true);
        case 'Gc':
          return this.tryUnwrapGenericCompTag(tag, dest, true);
        default:
          return false;
      }
    }
    skip(tag);

    const blank: VdomNode = { type: 'Blank' };
    if (res) dest.push(blank);
    return res;
  }

  private tryGetInjections(tag: AstNode, dest: Injection[]): boolean {
    for (let i = 0; i < tag.injections!.length; i++) {
      const value: unknown = this.getVar(tag.injections![i].value);

      if (!value) {
        this.logger.error(
          tag.injections![i].value.at(-1)!.pos,
          'Cannot find context value in attachments',
        );
        return false;
      }

      const contextKey: unknown = this.getVar(
        tag.injections![i].contextKey,
      );

      if (!contextKey) {
        this.logger.error(
          tag.injections![i].contextKey.at(-1)!.pos,
          'Cannot find context key in attachments',
        );
        return false;
      } else if (typeof contextKey !== 'string') {
        this.logger.error(
          tag.injections![i].contextKey.at(-1)!.pos,
          'The context key should be a string',
        );
        return false;
      }

      dest.push({ contextKey, value });
    }
    return true;
  }

  private tryUnwrapChildrenTag(dest: VdomNode[]): boolean {
    if (this.context.unwrapChildren) {
      return this.context.unwrapChildren(dest);
    }
    return true;
  }

  private tryUnwrapText(tag: AstNode, dest: VdomNode[]): boolean {
    const node: VdomNode = {
      type: 'Text',
      text: this.getText(tag.text!),
    };
    dest.push(node);
    return true;
  }

  private trySkipCompTag(tag: AstNode): boolean {
    const res = true;
    const func: ComponentFunc | undefined = this.context.importsMap.get(
      tag.id!.str,
    );

    if (!func) {
      this.logger.error(
        tag.id!.pos,
        'Cannot find the component function in imports',
      );
      return false;
    } else if (typeof func !== 'function' || func.length !== 1) {
      this.logger.error(
        tag.id!.pos,
        `Expected a component function, got ${typeof func}`,
      );
      return false;
    }
    if (res) this.vdomUnwrapper.skipComponent(func.name, this.level + 1);
    return res;
  }

  private trySkipGenericCompTag(tag: AstNode): boolean {
    const res = true;
    const func: unknown = this.getVar(tag.compFunc!);

    if (!func) {
      this.logger.error(
        tag.id!.pos,
        'Cannot find the component function in attachemnts',
      );
      return false;
    } else if (typeof func !== 'function' || func.length !== 1) {
      this.logger.error(
        tag.id!.pos,
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
        const value: unknown = this.getVar(prop.value!);

        if (typeof value !== 'object' || value === null) {
          this.logger.error(
            prop.value!.at(-1)!.pos,
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
      dest[name] = this.getVar(prop.value!);
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

import { DomElem } from '../dom/dom.types';
import { EventHandler, VdomEventType } from '../dom/events/event.types';
import {
  AnyObject,
  ComponentFunc,
  ComponentResult,
  ComponentUnwrapperContext,
  ComponentUnwrapperDto,
  Injection,
  VdomNode,
  VdomNodeType,
  VdomTagAttr,
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
  StrPtr,
  TagArgs,
  TagAttr,
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
    const rootTagChild: AstNode | undefined = this.root.children?.[0];

    if (!rootTagChild) {
      throw new Error('Incomplete root node');
    }
    return this.tryUnwrapBasicTag(rootTagChild, this.dest, false);
  }

  private tryUnwrapNode(node: AstNode, dest: VdomNode[]): boolean {
    switch (node.type) {
      case 'Bt':
        return this.tryUnwrapBasicTag(node, dest, false);
      case 'Gt':
        return this.tryUnwrapGenTag(node, dest, false);
      case 'Cp':
        return this.tryUnwrapCompTag(node, dest, false);
      case 'Gc':
        return this.tryUnwrapGenCompTag(node, dest, false);
      case 'Ch':
        return this.tryUnwrapChildrenTag(dest);
      case 'Tx':
        return this.tryUnwrapText(node, dest);
      default:
        throw new Error('Unsupported node type');
    }
  }

  private tryUnwrapBasicTag(
    tag: AstNode,
    dest: VdomNode[],
    skipCommands: boolean,
  ): boolean {
    let res = true;

    if (tag.keymapArgs && !skipCommands) {
      const children: VdomNode[] = [];

      const node: VdomNode = {
        type: 'Keymap',
        children,
        keymap: new Map(),
      };

      res =
        this.tryUnwrapKeymap(tag.keymapArgs, () =>
          this.tryUnwrapBasicTag(tag, children, true),
        ) && res;

      if (!res) return false;

      for (let i = 0; i < children.length; i++) {
        node.keymap!.set(children[i]!.key!, children[i]!);
      }
      return true;
    }
    if (tag.condition && !skipCommands) {
      return this.tryUnwrapCondition(tag, tag.condition, dest, () =>
        this.tryUnwrapBasicTag(tag, dest, true),
      );
    }

    const children: VdomNode[] = [];

    const node: VdomNode = {
      type: 'Tag',
      tag: tag.id!.str,
      key: undefined,
      ref: undefined,
      attrs: [],
      eventsMap: new Map(),
      children,
    };

    if (tag.keymapArgs?.key) {
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

    if (tag.ref) {
      const ref: unknown = this.getVar(tag.ref);

      if (
        ref === null ||
        typeof ref !== 'object' ||
        !Object.hasOwn(ref, 'current')
      ) {
        this.logger.error(tag.ref.at(-1)!.pos, 'Invalid ref value');
        return false;
      }
      node.ref = ref as { current: DomElem | null };
    }

    res = this.tryGetTagAttrs(tag.tagArgs!.attrs, node.attrs!) && res;
    res = this.tryGetEventsMap(tag.tagArgs!.events, node.eventsMap!) && res;

    const tagChildren = tag.children!;

    for (let i = 0; i < tagChildren.length; i++) {
      res = this.tryUnwrapNode(tagChildren[i]!, children) && res;
    }
    if (res) dest.push(node);
    return res;
  }

  private tryUnwrapGenTag(
    tag: AstNode,
    dest: VdomNode[],
    skipCommands: boolean,
    tagName?: string,
  ): boolean {
    let res = true;

    if (!tagName) {
      const name: unknown = this.getVar(tag.tagName!);

      if (typeof name !== 'string') {
        this.logger.error(
          tag.tagName!.at(-1)!.pos,
          'Tag id must be a string',
        );
        return false;
      }
      tagName = name;
    }

    if (tag.keymapArgs && !skipCommands) {
      const children: VdomNode[] = [];

      const node: VdomNode = {
        type: 'GenKeymap',
        id: tagName,
        children,
        keymap: new Map(),
      };

      res =
        this.tryUnwrapKeymap(tag.keymapArgs, () =>
          this.tryUnwrapGenTag(tag, children, true, tagName),
        ) && res;

      if (!res) return false;

      for (let i = 0; i < children.length; i++) {
        node.keymap!.set(children[i]!.key!, children[i]!);
      }
      return true;
    }
    if (tag.condition && !skipCommands) {
      return this.tryUnwrapCondition(tag, tag.condition, dest, () =>
        this.tryUnwrapGenTag(tag, dest, true, tagName),
      );
    }

    const children: VdomNode[] = [];

    const node: VdomNode = {
      type: 'GenTag',
      tag: tagName,
      key: undefined,
      ref: undefined,
      attrs: [],
      eventsMap: new Map(),
      children,
    };

    if (tag.keymapArgs?.key) {
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

    if (tag.ref) {
      const ref: unknown = this.getVar(tag.ref);

      if (
        ref === null ||
        typeof ref !== 'object' ||
        !Object.hasOwn(ref, 'current')
      ) {
        this.logger.error(tag.ref.at(-1)!.pos, 'Invalid ref value');
        return false;
      }
      node.ref = ref as { current: DomElem | null };
    }

    res = this.tryGetTagAttrs(tag.tagArgs!.attrs, node.attrs!) && res;
    res = this.tryGetEventsMap(tag.tagArgs!.events, node.eventsMap!) && res;

    const tagChildren = tag.children!;

    for (let i = 0; i < tagChildren.length; i++) {
      res = this.tryUnwrapNode(tagChildren[i]!, children) && res;
    }
    if (res) dest.push(node);
    return res;
  }

  private tryUnwrapCompTag(
    tag: AstNode,
    dest: VdomNode[],
    skipCommands: boolean,
  ): boolean {
    let res = true;

    if (tag.keymapArgs && !skipCommands) {
      const children: VdomNode[] = [];

      const node: VdomNode = {
        type: 'Keymap',
        children,
        keymap: new Map(),
      };

      res =
        this.tryUnwrapKeymap(tag.keymapArgs, () =>
          this.tryUnwrapCompTag(tag, children, true),
        ) && res;

      if (!res) return false;

      for (let i = 0; i < children.length; i++) {
        node.keymap!.set(children[i]!.key!, children[i]!);
      }
      return true;
    }
    if (tag.condition && !skipCommands) {
      return this.tryUnwrapCondition(tag, tag.condition, dest, () =>
        this.tryUnwrapCompTag(tag, dest, true),
      );
    }

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
      res = this.tryGetInjections(tag.injections!, injections);
    }

    const tagChildren = tag.children!;

    if (tagChildren.length > 0) {
      dto.unwrapChildren = (dest: VdomNode[]) => {
        let success = true;

        for (let i = 0; i < tagChildren.length; i++) {
          success = this.tryUnwrapNode(tagChildren[i]!, dest) && success;
        }
        return success;
      };
    }

    if (res) this.vdomUnwrapper.unwrapComponent(dto, injections);
    return res;
  }

  private tryUnwrapGenCompTag(
    tag: AstNode,
    dest: VdomNode[],
    skipCommands: boolean,
    compFunc?: ComponentFunc,
  ): boolean {
    let res = true;

    if (!compFunc) {
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
      compFunc = func as ComponentFunc;
    }

    if (tag.keymapArgs && !skipCommands) {
      const children: VdomNode[] = [];

      const node: VdomNode = {
        type: 'GenKeymap',
        id: compFunc.name,
        children,
        keymap: new Map(),
      };

      res =
        this.tryUnwrapKeymap(tag.keymapArgs, () =>
          this.tryUnwrapGenCompTag(tag, children, true, compFunc),
        ) && res;

      if (!res) return false;

      for (let i = 0; i < children.length; i++) {
        node.keymap!.set(children[i]!.key!, children[i]!);
      }
      return true;
    }
    if (tag.condition && !skipCommands) {
      return this.tryUnwrapCondition(tag, tag.condition, dest, () =>
        this.tryUnwrapGenCompTag(tag, dest, true, compFunc),
      );
    }

    const dto: ComponentUnwrapperDto = {
      level: this.level + 1,
      dest,
      componentId: compFunc.name,
      func: compFunc,
      props: {},
      unwrapChildren: undefined,
    };

    res = this.tryGetProps(tag.props!, dto.props) && res;

    const injections: Injection[] = [];

    if (tag.injections) {
      res = this.tryGetInjections(tag.injections!, injections);
    }

    const tagChildren = tag.children!;

    if (tagChildren.length > 0) {
      dto.unwrapChildren = (dest: VdomNode[]) => {
        let success = true;

        for (let i = 0; i < tagChildren.length; i++) {
          success = this.tryUnwrapNode(tagChildren[i]!, dest) && success;
        }
        return success;
      };
    }

    if (res) this.vdomUnwrapper.unwrapComponent(dto, injections);
    return res;
  }

  private tryUnwrapKeymap(
    keymap: KeymapArgs,
    unwrapNode: () => boolean,
  ): boolean {
    let res = true;

    const alias = keymap.alias.str;

    if (this.context.attachMap.has(alias)) {
      this.logger.error(
        keymap.alias.pos,
        'The property already exists in attachments',
      );
      return false;
    }

    const items: unknown = this.getVar(keymap.items);

    if (!Array.isArray(items)) {
      this.logger.error(
        keymap.items.at(-1)!.pos,
        'The keymap items must be an array',
      );
      return false;
    }

    for (let i = 0; i < items.length; i++) {
      this.context.attachMap.set(alias, items[i]);
      res = unwrapNode() && res;
    }
    this.context.attachMap.delete(alias);

    return res;
  }

  private tryUnwrapCondition(
    tag: AstNode,
    condition: ConditionArgs,
    dest: VdomNode[],
    unwrapNode: () => boolean,
  ): boolean {
    let res = true;

    let predicate: boolean = !!this.getVar(condition.predicate);
    predicate = condition.invert ? !predicate : predicate;

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
      return unwrapNode();
    }
    skip(tag);
    const blank: VdomNode = { type: 'Blank' };

    if (res) dest.push(blank);
    return res;
  }

  private tryGetInjections(
    injections: InjectionArg[],
    dest: Injection[],
  ): boolean {
    for (let i = 0; i < injections.length; i++) {
      const value: unknown = this.getVar(injections[i]!.value);

      if (!value) {
        this.logger.error(
          injections[i]!.value.at(-1)!.pos,
          'Cannot find context value in attachments',
        );
        return false;
      }

      const contextKey: unknown = this.getVar(injections[i]!.contextKey);

      if (!contextKey) {
        this.logger.error(
          injections[i]!.contextKey.at(-1)!.pos,
          'Cannot find context key in attachments',
        );
        return false;
      } else if (typeof contextKey !== 'string') {
        this.logger.error(
          injections[i]!.contextKey.at(-1)!.pos,
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
      const prop: PropAttr = tagProps[i]!;

      if (prop.isSpread) {
        const value: unknown = this.getVar(prop.value!);

        if (typeof value !== 'object' || value === null) {
          this.logger.error(
            prop.value!.at(-1)!.pos,
            'The spread prop value must be an object',
          );
          return false;
        }
        for (const p in value) {
          dest[p] = (value as { [key: string]: any })[p];
        }
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

  private tryGetTagAttrs(attrs: TagAttr[], dest: VdomTagAttr[]): boolean {
    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i]!;

      if (attr.boolLiteral !== undefined) {
        dest.push({
          id: attr.attr,
          shouldSet: attr.boolLiteral,
          value: '',
        });
        continue;
      } else if (attr.boolValue) {
        const boolValue = !!this.getVar(attr.boolValue);

        dest.push({ id: attr.attr, shouldSet: boolValue, value: '' });
        continue;
      } else if (attr.strValue) {
        const value = this.getText(attr.strValue).trim();
        let shouldSet = true;

        if (value === '') {
          shouldSet = false;
        }
        dest.push({ id: attr.attr, shouldSet, value });
        continue;
      }
      throw new Error('Incomplete tag attribute');
    }
    return true;
  }

  private tryGetEventsMap(
    events: EventAttr[],
    dest: Map<VdomEventType, EventHandler>,
  ): boolean {
    for (let i = 0; i < events.length; i++) {
      const event = events[i]!;

      if (!this.context.attachMap.has(event.handler[0]!.str)) {
        this.logger.error(
          event.handler[0]!.pos,
          'Event handler is not included in attachments',
        );
        return false;
      }

      const handler: unknown = this.getVar(event.handler);

      if (!handler) {
        continue;
      }

      if (typeof handler !== 'function') {
        this.logger.error(
          event.handler.at(-1)!.pos,
          `Expected an event handler, got ${typeof handler}`,
        );
        return false;
      }
      dest.set(event.event, handler as EventHandler);
    }
    return true;
  }

  private getText(interStr: InterStr): string {
    let str = '';

    for (let i = 0; i < interStr.length; i++) {
      const chunk: StrPtr | Var = interStr[i]!;

      if ('str' in chunk) {
        str += chunk.str;
        continue;
      }
      const value: unknown = this.getVar(chunk);

      switch (typeof value) {
        case 'undefined':
          continue;
        case 'object':
          this.logger.warning(
            chunk.at(-1)!.pos,
            'Inserting a JS object into a string may be unintentional',
          );
          str += '{object}';
          continue;
        case 'function':
          this.logger.warning(
            chunk.at(-1)!.pos,
            'Inserting a function into a string may be unintentional',
          );
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
    if (value.length < 1) {
      throw new Error('Variable should at least have one child');
    }
    let result: unknown = this.context.attachMap.get(value[0]!.str);

    if (value.length === 1) {
      return result;
    }

    for (let i = 1; i < value.length; i++) {
      if (!result) {
        this.logger.error(
          value[i - 1]!.pos,
          'The value seems to be undefined',
        );
        return result;
      }
      result = (result as AnyObject)[value[i]!.str];
    }
    return result;
  }
}

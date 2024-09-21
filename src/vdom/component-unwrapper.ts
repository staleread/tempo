import { DomElem } from '../dom/dom.types';
import { EventHandler, VdomEventType } from '../dom/events/event.types';
import {
  AnyObject,
  ComponentFunc,
  ComponentNode,
  ComponentResult,
  ComponentUnwrapDto,
  ComponentUnwrapperContext,
  Injection,
  VdomNode,
  VdomNodeType,
  VdomTagAttr,
} from './vdom.types';

import {
  AstNode,
  AstNodeType,
  Condition,
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
import { isRef } from './vdom.guards';

export class ComponentUnwrapper {
  constructor(
    private readonly stateLevel: number,
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
    return this.tryUnwrapNode(rootTagChild, this.dest);
  }

  private tryUnwrapNode(node: AstNode, dest: VdomNode[]): boolean {
    switch (node.type) {
      case 'Bt':
      case 'Gt':
        return this.tryUnwrapTagNode(node, dest, false);
      case 'Cp':
      case 'Gc':
        return this.tryUnwrapComp(node, dest, false);
      case 'Ch':
        return this.tryUnwrapChildren(dest);
      case 'Tx':
        return this.tryUnwrapTextNode(node, dest);
      default:
        throw new Error('Unsupported node type');
    }
  }

  private tryUnwrapTextNode(astNode: AstNode, dest: VdomNode[]): boolean {
    if (!astNode.text) {
      throw new Error('Text is not defined');
    }

    const node: VdomNode = {
      type: 'Text',
      text: this.getText(astNode.text),
    };

    dest.push(node);
    return true;
  }

  private tryUnwrapChildren(dest: VdomNode[]): boolean {
    return this.context.unwrapChildrenCallback
      ? this.context.unwrapChildrenCallback(dest)
      : true;
  }

  private tryUnwrapTagNode(
    astNode: AstNode,
    dest: VdomNode[],
    skipCommands: boolean,
    tag?: string,
  ): boolean {
    const node: VdomNode = { type: 'Tag' };

    if (!this.trySetTagName(node, astNode, tag)) {
      return false;
    }

    const keymapRes = this.trySetKeymap(
      node,
      astNode,
      dest,
      skipCommands,
      (mapDest) => this.tryUnwrapTagNode(astNode, mapDest, true, node.tag!),
    );

    switch (keymapRes) {
      case 'error':
        return false;
      case 'success':
        return true;
    }

    const conditionRes = this.trySetCondition(astNode, dest);

    switch (conditionRes) {
      case 'error':
        return false;
      case 'success':
        return true;
    }

    const vnodeSetupChain: Array<() => boolean> = [
      () => this.trySetRef(node, astNode),
      () => this.trySetAttrs(node, astNode),
      () => this.trySetEvents(node, astNode),
      () => this.trySetChildren(node, astNode),
    ];

    if (vnodeSetupChain.some((func) => !func())) {
      return false;
    }

    dest.push(node);
    return true;
  }

  private tryUnwrapComp(
    astNode: AstNode,
    dest: VdomNode[],
    skipCommands: boolean,
    compFunc?: ComponentFunc,
  ): boolean {
    const node: ComponentNode = {};

    if (!this.trySetCompFunc(node, astNode, compFunc)) {
      return false;
    }

    const keymapRes = this.trySetKeymap(
      node,
      astNode,
      dest,
      skipCommands,
      (mapDest) =>
        this.tryUnwrapComp(astNode, mapDest, true, node.componentFunc!),
    );

    switch (keymapRes) {
      case 'error':
        return false;
      case 'success':
        return true;
    }

    const conditionRes = this.trySetCondition(astNode, dest);

    switch (conditionRes) {
      case 'error':
        return false;
      case 'success':
        return true;
    }

    const compSetupChain: Array<() => boolean> = [
      () => this.trySetComponentId(node, astNode),
      () => this.trySetProps(node, astNode),
      () => this.trySetInjections(node, astNode),
      () => this.trySetUnwrapChildrenCallback(node, astNode),
    ];

    if (compSetupChain.some((func) => !func())) {
      return false;
    }

    const dto: ComponentUnwrapDto = {
      dest,
      stateLevel: this.stateLevel + 1,
      componentFunc: node.componentFunc!,
      props: node.props!,
      unwrapChildrenCallback: node.unwrapChildrenCallback,
    };

    this.vdomUnwrapper.unwrapComponent(
      dto,
      node.injections!,
      node.componentId!,
    );
    return true;
  }

  private trySetTagName(
    node: VdomNode,
    astNode: AstNode,
    tag: string | undefined,
  ): boolean {
    if (tag) {
      node.tag = tag;
      return true;
    }
    if (astNode.tagName) {
      const tagName: unknown = this.getVar(astNode.tagName);

      if (typeof tagName !== 'string') {
        this.logger.error(
          astNode.tagName.at(-1)!.pos,
          'Tag name must be a string',
        );
        return false;
      }
      node.tag = tagName;
      return true;
    }
    if (!astNode.id) {
      throw new Error('Id not defined');
    }
    node.tag = astNode.id.str;
    return true;
  }

  private trySetKeymap(
    node: VdomNode | ComponentNode,
    astNode: AstNode,
    dest: VdomNode[],
    skipCommands: boolean,
    unwrapNodeCallback: (dest: VdomNode[]) => boolean,
  ): 'success' | 'error' | 'continue' {
    if (!astNode.keymapArgs) {
      throw new Error('Keymap args not defined');
    }
    if (astNode.keymapArgs.key.length === 0) {
      return 'continue';
    }
    if (skipCommands) {
      return 'success';
    }

    const kmapNode: VdomNode = {
      type: 'Keymap',
      childMap: new Map(),
    };

    switch (astNode.type) {
      case 'Bt':
      case 'Gt':
        kmapNode.keymapId = (node as VdomNode).tag!;
        break;
      case 'Cp':
      case 'Gc':
        kmapNode.keymapId = (node as ComponentNode).componentFunc!.name;
        break;
      default:
        throw new Error('Unexpected node type');
    }

    const children: VdomNode[] = [];
    const args = astNode.keymapArgs!;
    const alias = args.alias.str;

    if (this.context.attachMap.has(alias)) {
      this.logger.error(
        args.alias.pos,
        'The property already exists in attachments',
      );
      return 'error';
    }

    const items: unknown = this.getVar(args.items);

    if (!Array.isArray(items)) {
      this.logger.error(
        args.items.at(-1)!.pos,
        'The keymap items must be an array',
      );
      return 'error';
    }

    for (let i = 0; i < items.length; i++) {
      this.context.attachMap.set(alias, items[i]);

      if (!unwrapNodeCallback(children)) {
        return 'error';
      }
      const child = children[i]!;
      const kmapKey: unknown = this.getVar(args.key);

      if (typeof kmapKey !== 'string' && typeof kmapKey !== 'number') {
        this.logger.error(
          args.key.at(-1)!.pos,
          `Keymap key must be a string or number, got ${typeof kmapKey}`,
        );
        return 'error';
      }

      child.keymapKey = kmapKey;
      kmapNode.childMap!.set(kmapKey, child);
    }
    this.context.attachMap.delete(alias);

    dest.push(kmapNode);
    return 'success';
  }

  private trySetCondition(
    astNode: AstNode,
    dest: VdomNode[],
  ): 'success' | 'error' | 'continue' {
    if (!astNode.condition) {
      throw new Error('Condition not defined');
    }
    if (astNode.condition.predicate.length === 0) {
      return 'continue';
    }

    let predicate: boolean = !!this.getVar(astNode.condition.predicate);

    predicate = astNode.condition.invert ? !predicate : predicate;

    if (predicate) {
      return 'continue';
    }

    let res = true;

    const skip = (an: AstNode) => {
      if (!an.children) {
        return;
      }
      if (['Cp', 'Gc'].includes(an.type)) {
        const compNode: ComponentNode = {};

        if (
          !this.trySetCompFunc(compNode, an) ||
          !this.trySetComponentId(compNode, an)
        ) {
          res = false;
          return;
        }
        this.vdomUnwrapper.skipComponent(
          this.stateLevel + 1,
          compNode.componentId!,
        );
        return;
      }
      an.children.forEach((c: AstNode) => skip(c));
    };

    skip(astNode);
    const blank: VdomNode = { type: 'Blank' };

    if (res) dest.push(blank);
    return res ? 'success' : 'error';
  }

  private trySetRef(node: VdomNode, astNode: AstNode): boolean {
    if (!astNode.ref) {
      throw new Error('Ref not defined');
    }
    if (astNode.ref.length === 0) {
      return true;
    }
    const ref: unknown = this.getVar(astNode.ref);

    if (!isRef(ref)) {
      this.logger.error(astNode.ref.at(-1)!.pos, 'Invalid ref value');
      return false;
    }
    node.ref = ref;
    return true;
  }

  private trySetAttrs(node: VdomNode, astNode: AstNode): boolean {
    if (!astNode.attrs) {
      throw new Error('Attrs not defined');
    }

    const dest: VdomTagAttr[] = [];

    for (let i = 0; i < astNode.attrs.length; i++) {
      const attr = astNode.attrs[i]!;

      if (attr.boolLiteral !== undefined) {
        dest.push({
          id: attr.attr,
          shouldSet: attr.boolLiteral,
          value: '',
        });
        continue;
      }
      if (attr.boolValue) {
        const boolValue = !!this.getVar(attr.boolValue);

        dest.push({ id: attr.attr, shouldSet: boolValue, value: '' });
        continue;
      }
      if (attr.strValue) {
        const value = this.getText(attr.strValue);

        dest.push({ id: attr.attr, shouldSet: true, value });
        continue;
      }
      throw new Error('Incomplete tag attribute');
    }

    node.attrs = dest;
    return true;
  }

  private trySetEvents(node: VdomNode, astNode: AstNode): boolean {
    if (!astNode.events) {
      throw new Error('Events are not defined');
    }

    const map: Map<VdomEventType, EventHandler> = new Map();

    for (let i = 0; i < astNode.events.length; i++) {
      const event = astNode.events[i]!;
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
      map.set(event.event, handler as EventHandler);
    }

    node.eventsMap = map;
    return true;
  }

  private trySetChildren(node: VdomNode, astNode: AstNode): boolean {
    if (!astNode.children) {
      throw new Error('Children not defined');
    }

    const children: VdomNode[] = [];
    let res = true;

    for (let i = 0; i < astNode.children.length; i++) {
      res = this.tryUnwrapNode(astNode.children[i]!, children) && res;
    }

    if (res) node.children = children;
    return res;
  }

  private trySetCompFunc(
    node: ComponentNode,
    astNode: AstNode,
    compFunc?: ComponentFunc,
  ): boolean {
    if (compFunc) {
      node.componentFunc = compFunc;
      return true;
    }
    if (!astNode.id) {
      throw new Error('Id not defined');
    }
    if (astNode.compFunc) {
      const func: unknown = this.getVar(astNode.compFunc);

      if (!func) {
        this.logger.error(
          astNode.id.pos,
          'Cannot find the component function in attachemnts',
        );
        return false;
      } else if (typeof func !== 'function') {
        this.logger.error(
          astNode.id.pos,
          `Expected a component function, got ${typeof func}`,
        );
        return false;
      }

      node.componentFunc = func as ComponentFunc;
      return true;
    }

    const func: ComponentFunc | undefined = this.context.importsMap.get(
      astNode.id.str,
    );

    if (!func) {
      this.logger.error(
        astNode.id.pos,
        'Cannot find the component function in imports',
      );
      return false;
    } else if (typeof func !== 'function') {
      this.logger.error(
        astNode.id.pos,
        `Expected a component function, got ${typeof func}`,
      );
      return false;
    }

    node.componentFunc = func;
    return true;
  }

  private trySetComponentId(
    node: ComponentNode,
    astNode: AstNode,
  ): boolean {
    if (!astNode.compFunc || !node.componentFunc) {
      throw new Error('Component function not defined');
    }
    if (!astNode.stateKey) {
      node.componentId = node.componentFunc.name;
      return true;
    }
    const stateKey: unknown = this.getVar(astNode.stateKey);

    if (typeof stateKey !== 'string' && typeof stateKey !== 'number') {
      this.logger.error(
        astNode.stateKey.at(-1)!.pos,
        'State key should either be a string or a number',
      );
      return false;
    }
    node.componentId = stateKey;
    return true;
  }

  private trySetProps(node: ComponentNode, astNode: AstNode): boolean {
    if (!astNode.props) {
      throw new Error('Props are not defined');
    }

    const props: AnyObject = {};

    for (let i = 0; i < astNode.props.length; i++) {
      const prop: PropAttr = astNode.props[i]!;

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
          props[p] = (value as { [key: string]: any })[p];
        }
        continue;
      }
      const name: string = prop.prop;

      if (prop.strValue) {
        props[name] = this.getText(prop.strValue);
        continue;
      }
      if (prop.value) {
        props[name] = this.getVar(prop.value);
        continue;
      }
      if (prop.boolLiteral !== undefined) {
        props[name] = prop.boolLiteral;
        continue;
      }
      throw new Error('Incomplete prop');
    }

    node.props = props;
    return true;
  }

  private trySetInjections(node: ComponentNode, astNode: AstNode): boolean {
    if (!astNode.injections) {
      throw new Error('Injections not defined');
    }

    const dest: Injection[] = [];

    for (let i = 0; i < astNode.injections.length; i++) {
      const injection = astNode.injections[i]!;
      const value: unknown = this.getVar(injection.value);

      if (!value) {
        this.logger.error(
          injection.value.at(-1)!.pos,
          'Cannot find context value in attachments',
        );
        return false;
      }

      const contextKey: unknown = this.getVar(injection.contextKey);

      if (!contextKey) {
        this.logger.error(
          injection.contextKey.at(-1)!.pos,
          'Cannot find context key in attachments',
        );
        return false;
      } else if (typeof contextKey !== 'string') {
        this.logger.error(
          injection.contextKey.at(-1)!.pos,
          'The context key must be a string',
        );
        return false;
      }

      dest.push({ contextKey, value });
    }
    node.injections = dest;
    return true;
  }

  private trySetUnwrapChildrenCallback(
    node: ComponentNode,
    astNode: AstNode,
  ): boolean {
    if (!astNode.children) {
      throw new Error('Children are not defined');
    }
    if (astNode.children.length === 0) {
      return true;
    }
    const astNodeChildren = astNode.children;

    node.unwrapChildrenCallback = (dest: VdomNode[]) => {
      let success = true;

      for (let i = 0; i < astNodeChildren.length; i++) {
        const child = astNodeChildren[i]!;
        success = this.tryUnwrapNode(child, dest) && success;
      }
      return success;
    };
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

    const firstVarChunk = value[0]!;

    if (!this.context.attachMap.has(firstVarChunk.str)) {
      this.logger.error(
        firstVarChunk.pos,
        'The variable cannot be found in attachments',
      );
      return undefined;
    }

    let result: unknown = this.context.attachMap.get(firstVarChunk.str);

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

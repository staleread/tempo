import { DomElem } from '../dom/dom.types';
import { EventHandler, VdomEventType } from '../dom/events/event.types';
import {
  AnyObject,
  ComponentFunc,
  ComponentNode,
  ComponentResult,
  ComponentUnwrapDto,
  ComponentUnwrapperContext,
  VdomNode,
  VdomNodeType,
  VdomTagAttr,
} from './vdom.types';

import {
  AstNode,
  AstNodeType,
  Condition,
  EventAttr,
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

    const outStr = { str: undefined };

    if (!this.tryGetText(astNode.text, outStr)) {
      return false;
    }

    const text = outStr.str!;
    const node: VdomNode = { type: 'Text', text };

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
    keymapKey?: string | number,
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
      (mapDest, kmapKey) =>
        this.tryUnwrapComp(
          astNode,
          mapDest,
          true,
          node.componentFunc!,
          kmapKey,
        ),
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
      () => this.trySetComponentId(node, astNode, keymapKey),
      () => this.trySetProps(node, astNode),
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

    this.vdomUnwrapper.unwrapComponent(dto, node.componentId!);
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
      const outValue = { value: undefined };

      if (!this.tryGetVar(astNode.tagName, outValue)) {
        return false;
      }

      const tagName: unknown = outValue.value;

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
    unwrapNodeCallback: (
      dest: VdomNode[],
      kmapKey: string | number,
    ) => boolean,
  ): 'success' | 'error' | 'continue' {
    if (!astNode.keymapArgs) {
      throw new Error('Keymap args not defined');
    }
    if (skipCommands || astNode.keymapArgs.key.length === 0) {
      return 'continue';
    }

    let id: string | number;

    switch (astNode.type) {
      case 'Bt':
      case 'Gt':
        id = (node as VdomNode).tag!;
        break;
      case 'Cp':
      case 'Gc':
        id = (node as ComponentNode).componentFunc!.name;
        break;
      default:
        throw new Error('Unexpected node type');
    }

    const kmapNode: VdomNode = {
      type: 'Keymap',
      keymapCtx: {
        id,
        nodeMap: new Map(),
        keys: [],
      },
    };

    const childNodes: VdomNode[] = [];
    const args = astNode.keymapArgs!;
    const alias = args.alias.str;

    if (this.context.attachMap.has(alias)) {
      this.logger.error(
        args.alias.pos,
        'The property already exists in attachments',
      );
      return 'error';
    }

    const outValue = { value: undefined };

    if (!this.tryGetVar(args.items, outValue)) {
      return 'error';
    }
    const items: unknown = outValue.value;

    if (!Array.isArray(items)) {
      this.logger.error(
        args.items.at(-1)!.pos,
        'The keymap items must be an array',
      );
      return 'error';
    }

    for (let i = 0; i < items.length; i++) {
      this.context.attachMap.set(alias, items[i]);

      const outValue = { value: undefined };

      if (!this.tryGetVar(args.key, outValue)) {
        return 'error';
      }
      const kmapKey: unknown = outValue.value;

      if (typeof kmapKey !== 'string' && typeof kmapKey !== 'number') {
        this.logger.error(
          args.key.at(-1)!.pos,
          `Keymap key must be a string or number, got ${typeof kmapKey}`,
        );
        return 'error';
      }

      if (!unwrapNodeCallback(childNodes, kmapKey)) {
        return 'error';
      }
      const child = childNodes[i]!;
      child.keymapKey = kmapKey;

      kmapNode.keymapCtx!.nodeMap.set(kmapKey, child);
      kmapNode.keymapCtx!.keys.push(kmapKey);
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

    const outValue = { value: undefined };

    if (!this.tryGetVar(astNode.condition.predicate, outValue)) {
      return 'error';
    }
    let predicate: boolean = !!outValue.value;

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
    const outValue = { value: undefined };

    if (!this.tryGetVar(astNode.ref, outValue)) {
      return false;
    }

    const ref: unknown = outValue.value;

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
        const outValue = { value: undefined };

        if (!this.tryGetVar(attr.boolValue, outValue)) {
          return false;
        }

        const boolValue = !!outValue.value;

        dest.push({ id: attr.attr, shouldSet: boolValue, value: '' });
        continue;
      }
      if (attr.strValue) {
        const outStr = { str: undefined };

        if (!this.tryGetText(attr.strValue, outStr)) {
          return false;
        }

        const value = outStr.str!;

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
      const outValue = { value: undefined };

      if (!this.tryGetVar(event.handler, outValue)) {
        return false;
      }

      const handler: unknown = outValue.value;

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
      const outValue = { value: undefined };

      if (!this.tryGetVar(astNode.compFunc, outValue)) {
        return false;
      }

      const func: unknown = outValue.value;

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
    keymapKey?: string | number,
  ): boolean {
    if (!node.componentFunc) {
      throw new Error('Component function not defined');
    }
    if (!astNode.stateKey) {
      throw new Error('State key not defined');
    }
    if (astNode.stateKey.length === 0 && !keymapKey) {
      node.componentId = node.componentFunc.name;
      return true;
    }
    if (keymapKey) {
      node.componentId = keymapKey;
      return true;
    }

    const outValue = { value: undefined };

    if (!this.tryGetVar(astNode.stateKey, outValue)) {
      return false;
    }

    const stateKey: unknown = outValue.value;

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
        const outValue = { value: undefined };

        if (!this.tryGetVar(prop.value!, outValue)) {
          return false;
        }

        const value: unknown = outValue.value;

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
        const outStr = { str: undefined };

        if (!this.tryGetText(prop.strValue, outStr)) {
          return false;
        }

        props[name] = outStr.str!;
        continue;
      }
      if (prop.value) {
        const outValue = { value: undefined };

        if (!this.tryGetVar(prop.value, outValue)) {
          return false;
        }

        props[name] = outValue.value;
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

  private tryGetText(
    interStr: InterStr,
    outString: { str?: string },
  ): boolean {
    let str = '';

    for (let i = 0; i < interStr.length; i++) {
      const chunk: StrPtr | Var = interStr[i]!;

      if ('str' in chunk) {
        str += chunk.str;
        continue;
      }
      const outValue = { value: undefined };

      if (!this.tryGetVar(chunk, outValue)) {
        return false;
      }
      const value: unknown = outValue.value;

      switch (typeof value) {
        case 'undefined':
          continue;
        case 'object':
          this.logger.warning(
            chunk.at(-1)!.pos,
            'Inserting an object/null into a string may be unintentional',
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

    outString.str = str;
    return true;
  }

  private tryGetVar(value: Var, outValue: { value: unknown }): boolean {
    if (value.length < 1) {
      throw new Error('Variable should at least have one child');
    }

    const firstVarChunk = value[0]!;

    if (!this.context.attachMap.has(firstVarChunk.str)) {
      this.logger.error(
        firstVarChunk.pos,
        `Cannot find "${firstVarChunk.str}" in attachments`,
      );
      return false;
    }

    let result: unknown = this.context.attachMap.get(firstVarChunk.str);

    for (let i = 1; i < value.length; i++) {
      const varChunk = value[i]!;

      if (typeof result !== 'object' || result === null) {
        this.logger.error(
          varChunk.pos,
          'The property is not reachible. The one before is not an object',
        );
        return false;
      }
      result = (result as AnyObject)[value[i]!.str];
    }

    outValue.value = result;
    return true;
  }
}

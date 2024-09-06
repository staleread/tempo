import {
  AnyObject,
  ComponentAllocationContext,
  ComponentFunc,
  ComponentUnwrapperContext,
  Kvarg,
  Vnode,
} from './vdom.types';

import { AstNode } from '../ast/parser/parser.types';
import { Logger } from '../log/logger';
import { VdomUnwrapper } from './vdom-unwrapper';

export class ComponentUnwrapper {
  isError = false;

  constructor(
    private readonly level: number,
    private readonly root: AstNode,
    private readonly dest: Vnode[],
    private readonly logger: Logger,
    private readonly context: ComponentUnwrapperContext,
    private readonly vdomUnwrapper: VdomUnwrapper,
  ) {}

  public run(): boolean {
    this.visitBasicTag(this.root.children[0], this.dest);
    return !this.isError;
  }

  private visitNode(node: AstNode, dest: Vnode[]): void {
    switch (node.type) {
      case 'Bt':
        return this.visitBasicTag(node, dest);
      case 'Mp':
        return this.visitMapTag(node, dest);
      case 'If':
        return this.visitIfTag(node, dest);
      case 'Gt':
        return this.visitGenericTag(node, dest);
      case 'Tx':
        return this.visitText(node, dest);
      case 'Cp':
      case 'Gc':
        return this.visitCompLikeTag(node, dest);
      case 'Ij':
        return this.visitInjectTag(node, dest);
      default:
        this.isError = true;
        return this.logger.error(node.pos, 'Unexpected node');
    }
  }

  private visitBasicTag(tag: AstNode, dest: Vnode[]): void {
    const vnode: Vnode = {
      type: 'Tag',
      id: tag.id.str,
      attrs: this.getAttrs(tag),
      events: this.getEvents(tag),
      children: [],
    };

    dest.push(vnode);

    tag.children.forEach((c: AstNode) => this.visitNode(c, vnode.children));
  }

  private visitMapTag(tag: AstNode, dest: Vnode[]): void {
    const items = this.getVar(tag.context.value);

    if (!Array.isArray(items)) {
      this.isError = true;
      return this.logger.error(
        tag.context.value.vids.at(-1).pos,
        'The value must be an array',
      );
    }

    const alias = tag.context.alias.str;

    if (this.context.attachMap.has(alias)) {
      this.isError = true;
      return this.logger.error(
        tag.context.alias.pos,
        'The property already exists in attachments',
      );
    }

    items.forEach((i: any) => {
      this.context.attachMap.set(alias, i);
      this.visitNode(tag.children[0], dest);
    });
    this.context.attachMap.delete(alias);
  }

  private visitIfTag(tag: AstNode, dest: Vnode[]): void {
    if (this.getVar(tag.condition.value) ^ tag.condition.shouldNegate) {
      return this.visitNode(tag.children[0], dest);
    }

    const skip = (tag: AstNode) => {
      if (!tag.children) {
        return;
      }
      if (tag.type !== 'Cp') {
        tag.children.forEach((c: AstNode) => skip(c));
        return;
      }
      const func = this.context.importsMap.get(tag.id.str);

      if (!func) {
        this.isError = true;
        this.logger.error(
          tag.pos,
          'Cannot find the import for the component',
        );
      } else if (typeof func !== 'function') {
        this.isError = true;
        this.logger.error(
          tag.pos,
          `Expected a component function, got ${typeof func}`,
        );
      }
      return this.vdomUnwrapper.skipComponent(func!.name, this.level + 1);
    };
    skip(tag.children[0]);

    const blank: Vnode = { type: 'Blank' };
    dest.push(blank);
  }

  private visitGenericTag(tag: AstNode, dest: Vnode[]): void {
    const id = this.getVar(tag.context.value);

    if (typeof id !== 'string') {
      this.isError = true;
      this.logger.error(
        tag.context.value.vids.at(-1).pos,
        'Tag id must be a string',
      );
    }

    const vnode: Vnode = {
      type: 'Tag',
      id,
      attrs: this.getAttrs(tag),
      events: this.getEvents(tag),
      children: [],
    };

    dest.push(vnode);
    tag.children.forEach((c: AstNode) => this.visitNode(c, vnode.children));
  }

  private visitText(tag: AstNode, dest: Vnode[]): void {
    const node: Vnode = {
      type: 'Text',
      str: this.getText(tag),
    };
    dest.push(node);
  }

  private visitCompLikeTag(tag: AstNode, dest: Vnode[]): void {
    const allocCtxWrapper: any = {
      inner: undefined,
    };

    let currTag = tag;
    let currCtx = allocCtxWrapper;

    while (currTag) {
      let func: ComponentFunc | undefined;

      if (currTag.type === 'Gc') {
        func = this.getVar(currTag.context.value);
      } else {
        func = this.context.importsMap.get(currTag.id.str);
      }

      if (!func) {
        this.isError = true;
        const expectedSource =
          currTag.type === 'Gc' ? 'attachments' : 'imports';
        return this.logger.error(
          tag.pos,
          `Cannot find the component funtion in ${expectedSource}`,
        );
      } else if (typeof func !== 'function') {
        this.isError = true;
        return this.logger.error(
          tag.pos,
          `Expected a component function, got ${typeof func}`,
        );
      }

      const ctx: ComponentAllocationContext = {
        id: func.name,
        func: func!,
        props: this.getProps(currTag),
        ctx: this.context.ctx,
        inner: undefined,
      };

      currTag = currTag.children[0];
      currCtx.inner = ctx;
      currCtx = currCtx.inner;
    }

    const allocCtx: ComponentAllocationContext = allocCtxWrapper.inner;

    if (this.isError) {
      return;
    }
    this.vdomUnwrapper.unwrapComponent(dest, allocCtx, this.level + 1);
  }

  private visitInjectTag(tag: AstNode, dest: Vnode[]): void {
    if (!this.context.childAllocCtx) {
      this.isError = true;
      return this.logger.error(
        tag.pos,
        'The component has no children passed from outside',
      );
    }
    this.context.childAllocCtx.ctx = {
      ...this.context.childAllocCtx.ctx,
      ...this.getProps(tag),
    };

    if (this.isError) {
      return;
    }
    this.vdomUnwrapper.unwrapComponent(
      dest,
      this.context.childAllocCtx,
      this.level + 1,
    );
  }

  private getProps(tag: AstNode): AnyObject {
    let props: AnyObject = {};

    tag.props.forEach((p: AstNode) => {
      if (p.type === 'Sp') {
        const value = this.getVar(p.value);

        if (!value || typeof value[Symbol.iterator] !== 'function') {
          this.isError = true;
          this.logger.error(
            p.value.vids.at(-1).pos,
            'The value must be iterable',
          );
        }
        props = { ...props, ...value };
        return;
      }
      const id: string = p.id.str;

      if (p.strValue) {
        props[id] = this.getText(p.strValue);
        return;
      }
      props[id] = this.getVar(p.value);
    });

    return props;
  }

  private getAttrs(tag: AstNode): Kvarg[] {
    const attrs: Kvarg[] = [];

    tag.attrs.forEach((a: AstNode) => {
      attrs.push({ id: a.id.str, value: this.getText(a.strValue) });
    });
    return attrs;
  }

  private getEvents(tag: AstNode): Kvarg[] {
    const events: Kvarg[] = [];

    tag.events.forEach((e: AstNode) => {
      events.push({ id: e.id.str, value: this.getVar(e.value) });
    });
    return events;
  }

  private getVar(tag: AstNode): any {
    let value = this.context.attachMap.get(tag.vids[0].str);

    if (!value && tag.vids.length > 1) {
      this.isError = true;
      this.logger.error(tag.vids[0].pos, 'The value seems to be undefined');
    }

    for (let i = 1; i < tag.vids.length; i++) {
      if (!value) {
        this.isError = true;
        this.logger.error(
          tag.vids[0].pos,
          'The value seems to be undefined',
        );
      }
      value = value[tag.vids[i]];
    }
    return value;
  }

  private getText(tag: AstNode): string {
    let str = '';

    for (let i = 0; i < tag.chunks.length; i++) {
      if (tag.chunks[i].str) {
        str += tag.chunks[i].str;
        continue;
      }
      const value = this.getVar(tag.chunks[i].value);
      str += value.toString();
    }
    return str;
  }
}

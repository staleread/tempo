import { VdomNode, VdomTagAttr } from '../../vdom/vdom.types';
import { DomElem } from '../dom.types';
import { DomEventRegister } from '../events/dom-event-register';
import { VdomEventType } from '../events/event.types';
import { BridgeNode } from './diff.types';

export class DomUpdater {
  private vdomBridge?: BridgeNode;

  constructor(
    private readonly rootDomElem: Element,
    private readonly eventRegister: DomEventRegister,
  ) {}

  public updateDom(newVdom: VdomNode): void {
    if (this.vdomBridge) {
      this.updateNodes(
        this.vdomBridge.children!,
        newVdom.children!,
        this.vdomBridge.domElem!,
      );

      this.eventRegister.removeUnused();
      return;
    }

    this.vdomBridge = newVdom;
    const rootTag = this.vdomBridge.children?.[0];

    if (!rootTag) {
      throw new Error('Vdom must contain a root tag');
    }

    const frag = new DocumentFragment();

    this.attachNode(rootTag as BridgeNode, frag);
    this.rootDomElem.appendChild(frag);
  }

  private updateNodes(
    oldChildren: BridgeNode[],
    newChildren: VdomNode[],
    parentDomElem: DomElem,
  ): void {
    if (!oldChildren || !newChildren) {
      return;
    }

    for (let i = 0; i < oldChildren.length; i++) {
      const oldCh = oldChildren[i]!;
      const newCh = newChildren[i]!;

      if (oldCh.type === 'Blank' && newCh.type === 'Blank') {
        continue;
      }
      if (oldCh.type !== 'Blank' && newCh.type === 'Blank') {
        this.detachNodeRef(oldCh, parentDomElem);

        switch (oldCh.type) {
          case 'Text':
            parentDomElem.removeChild(oldCh.domTextNode!);
            return;
          case 'Tag':
            (oldCh as BridgeNode).domElem!.remove();
            return;
          case 'Comp':
            (oldCh.children![0] as BridgeNode).domElem!.remove();
          default:
            throw new Error('Unexpected node type to detach');
        }
        oldChildren[i] = { type: 'Blank' };
        continue;
      }
      if (oldCh.type === 'Blank') {
        const frag = new DocumentFragment();

        this.attachTag(newCh, frag);
        this.insertFragment(frag, oldChildren, i, parentDomElem);
        continue;
      }

      switch (oldCh.type) {
        case 'Text':
          if (oldCh.text! !== newCh.text!) {
            oldCh.domTextNode!.nodeValue = newCh.text!;
            oldCh.text = newCh.text!;
          }
          break;
        case 'Tag': {
          if (oldCh.tag === newCh.tag) {
            this.resolveTagDiff(oldCh, newCh);
            break;
          }
          const frag = new DocumentFragment();
          this.attachTag(newCh, frag);

          oldCh.domElem!.replaceWith(frag);
          oldChildren[i] = newCh;
          break;
        }
        case 'Comp': {
          const oldCompRootTag = oldCh.children![0] as BridgeNode;
          const newCompRootTag = newCh.children![0]!;

          if (
            oldCh.compName === newCh.compName &&
            oldCompRootTag.tag === newCompRootTag.tag
          ) {
            this.resolveTagDiff(oldCompRootTag, newCompRootTag);
            break;
          }
          const frag = new DocumentFragment();
          this.attachTag(newCompRootTag, frag);

          oldCompRootTag.domElem!.replaceWith(frag);
          oldChildren[i] = newCh;
          break;
        }
        case 'Keymap': {
          const newCtx = newCh.keymapCtx!;

          if (
            oldCh.keymapCtx!.keys.length > 0 ||
            newCtx.keys.length === 0
          ) {
            this.resolveKeymapDiff(oldCh, newCh);
            break;
          }
          const frag = new DocumentFragment();

          newCtx.keys.forEach((key: string | number) => {
            const node = newCtx.nodeMap.get(key)!;
            this.attachTag(node, frag);
          });

          this.insertFragment(frag, oldChildren, i, parentDomElem);
          oldChildren[i] = newCh;
          break;
        }
        default:
          throw new Error('Unexpected node');
      }
    }
  }

  private insertFragment(
    fragment: DocumentFragment,
    nodes: BridgeNode[],
    index: number,
    parentDomElem: DomElem,
  ): void {
    let nextDomElem: DomElem | undefined;

    for (let i = index + 1; i < nodes.length; i++) {
      const candidate = nodes[i] as BridgeNode;

      if (candidate.domElem) {
        nextDomElem = candidate.domElem;
        break;
      }
      if (candidate.type === 'Comp') {
        nextDomElem = (candidate.children![0] as BridgeNode).domElem!;
        break;
      }
      if (candidate.type !== 'Keymap') {
        continue;
      }
      if (!candidate.keymapCtx) {
        throw new Error('Keymap context not defined');
      }
      if (candidate.keymapCtx.keys.length === 0) {
        continue;
      }
      const ctx = candidate.keymapCtx;
      const key = ctx.keys[0]!;
      const node = ctx.nodeMap.get(key)!;

      nextDomElem = (node as BridgeNode).domElem!;
      break;
    }

    nextDomElem
      ? nextDomElem.before(fragment)
      : parentDomElem.appendChild(fragment);
  }

  private attachNode(node: BridgeNode, parentNode: Node): void {
    switch (node.type) {
      case 'Text':
        return this.attachText(node, parentNode);
      case 'Tag':
        return this.attachTag(node, parentNode);
      case 'Comp':
        const compRootNode = node.children![0] as BridgeNode;
        return this.attachTag(compRootNode, parentNode);
      case 'Keymap':
        node.keymapCtx!.keys.forEach((key: string | number) => {
          const tag = node.keymapCtx!.nodeMap.get(key) as BridgeNode;
          this.attachTag(tag, parentNode);
        });
        return;
      default:
        return;
    }
  }

  private attachText(node: BridgeNode, parentNode: Node): void {
    node.domTextNode = document.createTextNode(node.text!);
    parentNode.appendChild(node.domTextNode!);
  }

  private attachTag(node: BridgeNode, parentNode: Node): void {
    node.domElem = document.createElement(node.tag!);
    node.domElem._ref = node;

    if (node.ref) {
      node.ref.current = node.domElem!;
    }

    node.attrs!.forEach((a: VdomTagAttr) => {
      if (a.shouldSet) node.domElem!.setAttribute(a.id, a.value);
    });

    [...node.eventsMap!.keys()].forEach((e: VdomEventType) => {
      this.eventRegister.register(e);
    });

    parentNode.appendChild(node.domElem);

    node.children!.forEach((c: VdomNode) => {
      this.attachNode(c as BridgeNode, node.domElem!);
    });
  }

  private detachNodeRef(node: BridgeNode, parentDomElem: DomElem): void {
    switch (node.type) {
      case 'Text':
        parentDomElem.removeChild(node.domTextNode!);
        return;
      case 'Tag':
        node.domElem!.remove();
        return;
      default:
        return;
    }
  }

  private resolveTagDiff(oldNode: BridgeNode, newNode: VdomNode): void {
    for (let i = 0; i < oldNode.attrs!.length; i++) {
      const oldAttr = oldNode.attrs![i]!;
      const newAttr = newNode.attrs![i]!;

      if (
        oldAttr.value === newAttr.value &&
        oldAttr.shouldSet === newAttr.shouldSet
      ) {
        continue;
      }
      if (!newAttr.shouldSet) {
        oldNode.domElem!.removeAttribute(newAttr.id);
        continue;
      }
      if (oldNode.tag === 'input' && newAttr.id === 'value') {
        (oldNode.domElem as HTMLInputElement).value = newAttr.value;
        continue;
      }
      oldNode.domElem!.setAttribute(newAttr.id, newAttr.value);
    }

    oldNode.attrs = newNode.attrs;
    oldNode.eventsMap = newNode.eventsMap;

    [...oldNode.eventsMap!.keys()].forEach((e: VdomEventType) => {
      this.eventRegister.register(e);
    });

    this.updateNodes(
      oldNode.children!,
      newNode.children!,
      oldNode.domElem!,
    );
  }

  private resolveKeymapDiff(oldNode: BridgeNode, newNode: VdomNode): void {
    if (!oldNode.keymapCtx || !newNode.keymapCtx) {
      throw new Error('Keymap context not defined');
    }

    const oldKeys = oldNode.keymapCtx.keys;
    const oldNodeMap = oldNode.keymapCtx.nodeMap;

    const newKeys = newNode.keymapCtx.keys;
    const newNodeMap = newNode.keymapCtx.nodeMap;

    if (newKeys.length === 0 && oldKeys.length > 0) {
      oldKeys.forEach((key: string | number) => {
        const node = oldNodeMap.get(key)!;
        (node as BridgeNode).domElem!.remove();
      });

      oldNode.keymapCtx.keys = [];
      oldNode.keymapCtx.nodeMap = new Map();
      return;
    }
    if (oldNode.keymapCtx.id !== newNode.keymapCtx.id) {
      let firstDomElem: DomElem;

      oldKeys.forEach((key: string | number, i: number) => {
        const node = oldNodeMap.get(key)!;

        if (i === 0) {
          firstDomElem = (node as BridgeNode).domElem!;
          return;
        }
        (node as BridgeNode).domElem!.remove();
      });

      const frag = new DocumentFragment();

      newKeys.forEach((key: string | number) => {
        const node = newNodeMap.get(key)!;
        this.attachTag(node as BridgeNode, frag);
      });

      firstDomElem!.replaceWith(frag);
      oldNode.keymapCtx = newNode.keymapCtx;

      return;
    }

    let i = 0;

    for (i; i < oldKeys.length && i < newKeys.length; i++) {
      const oldKey = oldKeys[i]!;
      const oldCh = oldNodeMap.get(oldKey) as BridgeNode & {
        domElem: DomElem;
      };

      const newKey = newKeys[i]!;
      const newCh = newNodeMap.get(newKey)!;

      if (oldKey === newKey) {
        this.resolveTagDiff(oldCh, newCh);
        continue;
      }

      const isOldKeyInNewKeys = newNodeMap.has(oldKey);
      const expectedCh = oldNodeMap.get(newKey) as
        | (BridgeNode & { domElem: DomElem })
        | undefined;

      // Rearranged nodes
      //
      // OLD | {A} .. {B} |
      // ----+------------+  =>  {B} .. {A}
      // NEW |  B  ..  A  |       ^
      //        ^
      if (expectedCh && isOldKeyInNewKeys) {
        const expectedChIndex = oldKeys.indexOf(newKey);

        oldKeys.splice(i, 1, newKey);
        oldKeys.splice(expectedChIndex, 1, oldKey);

        const beforeExpectedDomElem =
          expectedCh.domElem!.previousElementSibling!;

        if (beforeExpectedDomElem === oldCh.domElem) {
          oldCh.domElem!.before(expectedCh.domElem!);
        } else {
          oldCh.domElem!.replaceWith(expectedCh.domElem!);
          beforeExpectedDomElem.after(oldCh.domElem!);
        }

        this.resolveTagDiff(expectedCh, newCh);
        continue;
      }

      // New node
      //
      // OLD | {A} ..    |
      // ----+-----------+  =>  {B} {A} ..
      // NEW |  B  ..  A |       ^
      //        ^
      if (!expectedCh && isOldKeyInNewKeys) {
        const frag = new DocumentFragment();
        this.attachTag(newCh, frag);

        oldKeys.splice(i, 0, newKey);
        oldCh.domElem!.before(frag);

        oldNodeMap.set(newKey, newCh);
        continue;
      }

      // Deleted node
      //
      // OLD | {A} .. {B} |
      // ----+------------+  =>  {B} ..
      // NEW |  B  ..     |       ^
      //        ^
      if (expectedCh) {
        oldCh.domElem!.replaceWith(expectedCh.domElem!);

        const expectedChIndex = oldKeys.indexOf(newKey);

        oldKeys.splice(expectedChIndex, 1);
        oldKeys.splice(i, 1, newKey);

        oldNodeMap.delete(oldKey);

        this.resolveTagDiff(expectedCh, newCh);
        continue;
      }

      // Replaced
      //
      // OLD | {A} .. |
      // ----+--------+  =>  {B}
      // NEW |  B  .. |
      //        ^
      const frag = new DocumentFragment();
      this.attachTag(newCh, frag);

      oldKeys.splice(i, 1, newKey);
      oldCh.domElem!.replaceWith(frag);

      oldNodeMap.delete(oldKey);
      oldNodeMap.set(newKey, newCh);
    }

    if (i === oldKeys.length && i === newKeys.length) {
      return;
    }

    if (i < oldKeys.length) {
      const tmpIndex = i;

      for (i; i < oldKeys.length; i++) {
        const node = oldNodeMap.get(oldKeys[i]!) as BridgeNode;

        node.domElem!.remove();
        oldNodeMap.delete(oldKeys[i]!);
      }

      oldKeys.splice(tmpIndex, oldKeys.length - tmpIndex);
      return;
    }

    const lastOldNode = oldNodeMap.get(oldKeys.at(-1)!) as BridgeNode;
    const lastElem = lastOldNode.domElem!;
    const frag = new DocumentFragment();

    for (i; i < newKeys.length; i++) {
      const node = newNodeMap.get(newKeys[i]!) as BridgeNode;
      this.attachTag(node, frag);

      oldKeys.push(newKeys[i]!);
      oldNodeMap.set(newKeys[i]!, node);
    }

    lastElem.after(frag);
  }
}

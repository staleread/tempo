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
      this.visitNodePairChildren(this.vdomBridge, newVdom);
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

  private visitNodePairChildren(
    oldNode: BridgeNode,
    newNode: VdomNode,
  ): void {
    const oldChildren = oldNode.children;
    const newChildren = newNode.children;

    if (!oldChildren || !newChildren) {
      return;
    }

    for (let i = 0; i < oldChildren.length; i++) {
      const oldCh = oldChildren[i]!;
      const newCh = newChildren[i]!;

      if (oldCh.type === 'Blank' && newCh.type === 'Blank') {
        continue;
      }
      if (newCh.type === 'Blank') {
        this.detachNodeRef(oldCh, oldNode.domElem!);
        oldChildren[i] = { type: 'Blank' };
        continue;
      }
      if (
        oldCh.type !== 'Blank' &&
        this.tryResolveNodesDiff(oldCh, newCh)
      ) {
        continue;
      }

      const frag = new DocumentFragment();

      if (oldCh.type === 'Keymap') {
        const ctx = newCh.keymapCtx!;

        ctx.keys.forEach((key: string | number) => {
          const node = ctx.nodeMap.get(key)!;
          this.attachTag(node, frag);
        });
      } else {
        this.attachNode(newCh, frag);
      }

      let nextDomElem: DomElem | undefined;

      for (let j = i + 1; j < oldChildren.length; j++) {
        const candidate = oldChildren[j] as BridgeNode;

        if (!candidate.domElem && candidate.type !== 'Keymap') {
          continue;
        }
        if (candidate.domElem) {
          nextDomElem = candidate.domElem;
          break;
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

      oldChildren[i] = newCh;

      nextDomElem
        ? nextDomElem.before(frag)
        : oldNode.domElem!.appendChild(frag);
    }
  }

  private attachNode(node: BridgeNode, parentNode: Node): void {
    switch (node.type) {
      case 'Text':
        return this.attachText(node, parentNode);
      case 'Tag':
        return this.attachTag(node, parentNode);
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

  private tryResolveNodesDiff(
    oldNode: BridgeNode,
    newNode: VdomNode,
  ): boolean {
    switch (oldNode.type) {
      case 'Text':
        return this.tryResolveTextDiff(oldNode, newNode);
      case 'Tag':
        return this.tryResolveTagDiff(oldNode, newNode);
      case 'Keymap':
        return this.tryResolveKeymapDiff(oldNode, newNode);
      default:
        throw new Error('Unexpected node');
    }
  }

  private tryResolveTextDiff(
    oldNode: BridgeNode,
    newNode: VdomNode,
  ): boolean {
    if (oldNode.text! !== newNode.text!) {
      oldNode.domTextNode!.nodeValue = newNode.text!;
      oldNode.text = newNode.text!;
    }
    return true;
  }

  private tryResolveTagDiff(
    oldNode: BridgeNode,
    newNode: VdomNode,
  ): boolean {
    if (oldNode.tag! !== newNode.tag!) {
      return false;
    }

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

    this.visitNodePairChildren(oldNode, newNode);

    return true;
  }

  private tryResolveKeymapDiff(
    oldNode: BridgeNode,
    newNode: VdomNode,
  ): boolean {
    if (!oldNode.keymapCtx || !newNode.keymapCtx) {
      throw new Error('Keymap context not defined');
    }

    const oldKeys = oldNode.keymapCtx.keys;
    const oldNodeMap = oldNode.keymapCtx.nodeMap;

    const newKeys = newNode.keymapCtx.keys;
    const newNodeMap = newNode.keymapCtx.nodeMap;

    if (newKeys.length > 0 && oldKeys.length === 0) {
      return false;
    }
    if (newKeys.length === 0 && oldKeys.length > 0) {
      oldKeys.forEach((key: string | number) => {
        const node = oldNodeMap.get(key)!;
        (node as BridgeNode).domElem!.remove();
      });

      oldNode.keymapCtx.keys = [];
      oldNode.keymapCtx.nodeMap = new Map();
      return true;
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

      return true;
    }

    let i = 0;

    for (i; i < oldKeys.length && i < newKeys.length; i++) {
      const oldCh = oldNodeMap.get(oldKeys[i]!) as BridgeNode & {
        domElem: DomElem;
      };
      const newCh = newNodeMap.get(newKeys[i]!)!;

      if (oldKeys[i] === newKeys[i]) {
        this.tryResolveTagDiff(oldCh, newCh);
        continue;
      }

      const targetKey = newKeys[i]!;
      const targetCh = oldNodeMap.get(targetKey) as
        | (BridgeNode & { domElem: DomElem })
        | undefined;

      if (targetCh) {
        targetCh.domElem.remove();

        const targetIndex = oldKeys.indexOf(targetKey);

        oldKeys.splice(targetIndex, 1);
        oldKeys.splice(i, 0, targetKey);

        oldCh.domElem.before(targetCh.domElem);
        this.tryResolveTagDiff(targetCh, newCh);

        continue;
      }

      oldKeys.splice(i, 0, targetKey);
      oldNodeMap.set(targetKey, newCh);

      const frag = new DocumentFragment();

      this.attachTag(newCh, frag);
      oldCh.domElem!.before(frag);
    }

    if (i < oldKeys.length) {
      const tmpIndex = i;

      for (i; i < oldKeys.length; i++) {
        const node = oldNodeMap.get(oldKeys[i]!) as BridgeNode;

        node.domElem!.remove();
        oldNodeMap.delete(oldKeys[i]!);
      }

      oldKeys.splice(tmpIndex, oldKeys.length - tmpIndex);
      return true;
    }
    if (i < newKeys.length) {
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
      return true;
    }
    return true;
  }
}

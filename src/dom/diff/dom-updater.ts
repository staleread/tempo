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
        this.attachNode(newCh, frag);
      } else {
        newCh.children!.forEach((c: BridgeNode) => this.attachTag(c, frag));
      }

      let nextDomElem: DomElem | undefined;

      for (let j = i + 1; j < oldChildren.length; j++) {
        const candidate = oldChildren[j] as BridgeNode;

        if (candidate.type === 'Keymap' && candidate.children!.length > 0) {
          nextDomElem = (candidate.children![0] as BridgeNode).domElem!;
          break;
        }
        if (candidate.domElem) {
          nextDomElem = candidate.domElem;
          break;
        }
      }

      oldChildren[i] = newCh;

      if (nextDomElem) {
        nextDomElem.before(frag);
        continue;
      }
      oldNode.domElem!.appendChild(frag);
    }
  }

  private attachNode(node: BridgeNode, parentNode: Node): void {
    switch (node.type) {
      case 'Text':
        return this.attachText(node, parentNode);
      case 'Tag':
        return this.attachTag(node, parentNode);
      case 'Keymap':
        node.children!.forEach((c: BridgeNode) =>
          this.attachTag(c, parentNode),
        );
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
    const oldChildren = oldNode.children!;
    const newChildren = newNode.children!;

    if (newChildren.length > 0 && oldChildren.length === 0) {
      return false;
    }
    if (newChildren.length === 0 && oldChildren.length > 0) {
      oldChildren.forEach((c: BridgeNode) => c.domElem!.remove());

      oldNode.children = [];
      oldNode.childMap = new Map();
      return true;
    }
    if (oldNode.keymapId! !== newNode.keymapId!) {
      for (let i = 1; i < oldChildren.length; i++) {
        (oldChildren[i] as BridgeNode).domElem!.remove();
      }
      const firstElem = (oldChildren[0] as BridgeNode).domElem!;
      oldNode.children = newChildren;

      const frag = new DocumentFragment();
      oldChildren.forEach((c: VdomNode) =>
        this.attachTag(c as BridgeNode, frag),
      );

      firstElem.replaceWith(frag);
      return true;
    }

    let index = 0;

    while (index < oldChildren.length && index < oldChildren.length) {
      const oldCh = oldChildren[index] as BridgeNode;
      const newCh = newChildren[index]!;

      if (oldCh.keymapKey! === newCh.keymapKey!) {
        this.tryResolveTagDiff(oldCh, newCh);

        index++;
        continue;
      }
      const targetCh = oldNode.childMap!.get(
        newCh.keymapKey!,
      ) as BridgeNode;

      if (targetCh) {
        targetCh.domElem!.remove();

        const chIndex = oldChildren.indexOf(targetCh);

        oldChildren.splice(chIndex, 1);
        oldChildren.splice(index, 0, targetCh);

        oldCh.domElem!.replaceWith(targetCh.domElem!);
        this.tryResolveTagDiff(targetCh, newCh);

        index++;
        continue;
      }

      oldChildren.splice(index, 0, newCh);

      const frag = new DocumentFragment();
      this.attachTag(newCh, frag);
      oldCh.domElem!.before(frag);

      index++;
    }

    if (index < oldChildren.length) {
      const tmpIndex = index;

      for (index; index < oldChildren.length; index++) {
        (oldChildren[index] as BridgeNode).domElem!.remove();
      }

      oldChildren.splice(tmpIndex, oldChildren.length - tmpIndex);
    } else if (index < newChildren.length) {
      const lastElem = (oldChildren.at(-1)! as BridgeNode).domElem!;

      const frag = new DocumentFragment();
      for (index; index < newChildren.length; index++) {
        this.attachTag(newChildren[index]!, frag);
      }

      lastElem.after(frag);
    }
    return true;
  }
}

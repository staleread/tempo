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

      if (!'GenKeymap'.includes(oldCh.type)) {
        this.attachNode(newCh, frag);
      } else {
        newCh.children!.forEach((c: BridgeNode) =>
          this.attachSomeTag(c, frag),
        );
      }

      let nextDomElem: DomElem | undefined;

      for (let j = i + 1; j < oldChildren.length; j++) {
        const candidate = oldChildren[j] as BridgeNode;

        if (
          'GenKeymap'.includes(candidate.type) &&
          candidate.children!.length > 0
        ) {
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
      case 'GenTag':
        return this.attachSomeTag(node, parentNode);
      case 'Keymap':
      case 'GenKeymap':
        node.children!.forEach((c: BridgeNode) =>
          this.attachSomeTag(c, parentNode),
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

  private attachSomeTag(node: BridgeNode, parentNode: Node): void {
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
      case 'GenTag':
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
      case 'GenTag':
        return this.tryResolveSomeTagDiff(oldNode, newNode);
      case 'Keymap':
      case 'GenKeymap':
        return this.tryResolveSomeKeymapDiff(oldNode, newNode);
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
    }
    return true;
  }

  private tryResolveSomeTagDiff(
    oldNode: BridgeNode,
    newNode: VdomNode,
  ): boolean {
    if (oldNode.type === 'GenTag' && oldNode.id! !== newNode.id!) {
      return false;
    }
    oldNode.attrs = newNode.attrs!;
    oldNode.eventsMap = newNode.eventsMap;

    oldNode.attrs!.forEach((a: VdomTagAttr) => {
      if (a.shouldSet) {
        oldNode.domElem!.setAttribute(a.id, a.value);
      } else {
        oldNode.domElem!.removeAttribute(a.id);
      }
    });

    [...oldNode.eventsMap!.keys()].forEach((e: VdomEventType) => {
      this.eventRegister.register(e);
    });

    this.visitNodePairChildren(oldNode, newNode);

    return true;
  }

  private tryResolveSomeKeymapDiff(
    oldNode: BridgeNode,
    newNode: VdomNode,
  ): boolean {
    const oldChildren = oldNode.children!;
    const newChildren = newNode.children!;

    if (newChildren.length > 0 && oldChildren.length < 1) {
      return false;
    }
    if (newChildren.length < 1 && oldChildren.length > 0) {
      oldChildren.forEach((c: BridgeNode) => c.domElem!.remove());

      oldNode.children = [];
      oldNode.keymap = new Map();
      return true;
    }
    if (oldNode.type === 'GenKeymap' && oldNode.id! !== newNode.id!) {
      for (let i = 1; i < oldChildren.length; i++) {
        (oldChildren[i] as BridgeNode).domElem!.remove();
      }
      const firstElem = (oldChildren[0] as BridgeNode).domElem!;
      oldNode.children = newChildren;

      const frag = new DocumentFragment();
      oldChildren.forEach((c: VdomNode) =>
        this.attachSomeTag(c as BridgeNode, frag),
      );

      firstElem.replaceWith(frag);
      return true;
    }

    let index = 0;

    while (index < oldChildren.length && index < oldChildren.length) {
      const oldCh = oldChildren[index] as BridgeNode;
      const newCh = newChildren[index]!;

      if (oldCh.key! === newCh.key!) {
        this.tryResolveSomeTagDiff(oldCh, newCh);

        index++;
        continue;
      }
      const targetCh = oldNode.keymap!.get(newCh.key!) as BridgeNode;

      if (targetCh) {
        targetCh.domElem!.remove();

        const chIndex = oldChildren.indexOf(targetCh);

        oldChildren.splice(chIndex, 1);
        oldChildren.splice(index, 0, targetCh);

        oldCh.domElem!.replaceWith(targetCh.domElem!);
        this.tryResolveSomeTagDiff(targetCh, newCh);

        index++;
        continue;
      }

      oldChildren.splice(index, 0, newCh);

      const frag = new DocumentFragment();
      this.attachSomeTag(newCh, frag);
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
        this.attachSomeTag(newChildren[index]!, frag);
      }

      lastElem.after(frag);
    }
    return true;
  }
}

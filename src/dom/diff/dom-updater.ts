import { TagAttr, VdomNode } from '../../vdom/vdom.types';
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
    if (!this.vdomBridge) {
      const frag = new DocumentFragment();

      this.attachNode(newVdom as BridgeNode, frag);
      this.rootDomElem.appendChild(frag);
      return;
    }
    this.visitNodePairChildren(this.vdomBridge, newVdom);
    this.eventRegister.removeUnused();
  }

  private visitNodePairChildren(
    oldNode: BridgeNode,
    newNode: VdomNode,
  ): void {
    if (!oldNode.children) {
      return;
    }

    for (let i = 0; i < oldNode.children.length; i++) {
      const oldCh = oldNode.children![i];
      const newCh = newNode.children![i];

      if (oldCh.type === 'Blank' && newCh.type === 'Blank') {
        continue;
      }
      if (newCh.type === 'Blank') {
        this.detachNode(oldCh, oldNode.domElem!);
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
        oldCh.children!.forEach((c: BridgeNode) =>
          this.attachSomeTag(c, frag),
        );
      }

      if (i > 0) {
        (oldNode.children![i - 1] as BridgeNode).domElem!.before(frag);
        continue;
      }
      oldNode.domElem!.prepend(frag);
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

    this.updateTagRef(node);

    parentNode.appendChild(node.domElem);

    node.children!.forEach((c: VdomNode) => {
      this.attachNode(c as BridgeNode, node.domElem!);
    });
  }

  private updateTagRef(node: BridgeNode): void {
    node.attrs!.forEach((a: TagAttr) => {
      node.domElem!.setAttribute(a.id, a.value);
    });

    [...node.eventsMap!.keys()].forEach((e: VdomEventType) => {
      this.eventRegister.register(e);
    });
  }

  private detachNode(node: BridgeNode, parentDomElem: DomElem): void {
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

    this.updateTagRef(oldNode);
    this.visitNodePairChildren(oldNode, newNode);

    return true;
  }

  private tryResolveSomeKeymapDiff(
    oldNode: BridgeNode,
    newNode: VdomNode,
  ): boolean {
    if (newNode.children!.length > 0 && oldNode.children!.length < 1) {
      return false;
    }
    if (newNode.children!.length < 1 && oldNode.children!.length > 0) {
      oldNode.children!.forEach((c: BridgeNode) => c.domElem!.remove());

      oldNode.children = [];
      oldNode.keymap = new Map();
      return true;
    }
    if (oldNode.type === 'GenKeymap' && oldNode.id! !== newNode.id!) {
      for (let i = 1; i < oldNode.children!.length; i++) {
        (oldNode.children![i] as BridgeNode).domElem!.remove();
      }
      const firstElem = (oldNode.children![0] as BridgeNode).domElem!;
      oldNode.children = newNode.children!;

      const frag = new DocumentFragment();
      oldNode.children!.forEach((c: VdomNode) =>
        this.attachSomeTag(c as BridgeNode, frag),
      );

      firstElem.replaceWith(frag);
      return true;
    }

    let index = 0;

    while (
      index < oldNode.children!.length &&
      index < oldNode.children!.length
    ) {
      const oldCh = oldNode.children![index] as BridgeNode;
      const newCh = newNode.children![index];

      if (oldCh.key! === newCh.key!) {
        this.tryResolveSomeTagDiff(oldCh, newCh);

        index++;
        continue;
      }
      const targetCh = oldNode.keymap!.get(newCh.key!) as BridgeNode;

      if (targetCh) {
        targetCh.domElem!.remove();

        const chIndex = oldNode.children!.indexOf(targetCh);

        oldNode.children!.splice(chIndex, 1);
        oldNode.children!.splice(index, 0, targetCh);

        oldCh.domElem!.replaceWith(targetCh.domElem!);
        this.tryResolveSomeTagDiff(targetCh, newCh);

        index++;
        continue;
      }

      oldNode.children!.splice(index, 0, newCh);

      const frag = new DocumentFragment();
      this.attachSomeTag(newCh, frag);
      oldCh.domElem!.before(frag);

      index++;
    }

    if (index < oldNode.children!.length) {
      const tmpIndex = index;

      for (index; index < oldNode.children!.length; index++) {
        (oldNode.children![index] as BridgeNode).domElem!.remove();
      }

      oldNode.children!.splice(
        tmpIndex,
        oldNode.children!.length - tmpIndex,
      );
    } else if (index < newNode.children!.length) {
      const lastElem = (oldNode.children!.at(-1)! as BridgeNode).domElem!;

      const frag = new DocumentFragment();
      for (index; index < newNode.children!.length; index++) {
        this.attachSomeTag(newNode.children![index], frag);
      }

      lastElem.after(frag);
    }
    return true;
  }
}

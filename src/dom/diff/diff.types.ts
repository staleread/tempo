import { VdomNode } from '../../vdom/vdom.types';
import { DomElem } from '../dom.types';

export type BridgeNode = {
  domElem?: DomElem;
  domTextNode?: Text;
} & VdomNode;

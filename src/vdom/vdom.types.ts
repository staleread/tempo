import { DomElem } from '../dom/dom.types';
import { EventHandler, VdomEventType } from '../dom/events/event.types';

export type VdomNodeType =
  | 'Root'
  | 'Text'
  | 'Tag'
  | 'GenTag'
  | 'Keymap'
  | 'GenKeymap'
  | 'Blank';

export type VdomNode = {
  type: VdomNodeType;
  text?: string;
  tag?: string;
  key?: string | number;
  id?: string;
  attrs?: TagAttr[];
  eventsMap?: Map<VdomEventType, EventHandler>;
  componentId?: string;
  children?: VdomNode[];
  domElemMap?: Map<string | number, DomElem>;
  domElem?: DomElem;
  domTextNode?: Text;
};

export type TagAttr = { id: string; value: string };
export type AnyObject = { [key: string]: any };

export type Injection = {
  contextKey: string;
  value: unknown;
};

export type ComponentFunc = (props?: AnyObject) => ComponentResult;

export type ComponentResult = {
  imports?: ComponentFunc[];
  template: string;
  attach?: AnyObject;
};

export type ComponentUnwrapperDto = {
  level: number;
  dest: VdomNode[];
  componentId: string;
  func: ComponentFunc;
  props: AnyObject;
  unwrapChildren?: (dest: VdomNode[]) => boolean;
};

export type ComponentUnwrapperContext = {
  importsMap: Map<string, ComponentFunc>;
  attachMap: Map<string, unknown>;
  unwrapChildren?: (dest: VdomNode[]) => boolean;
};

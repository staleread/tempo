import { DomElem } from '../dom/dom.types';
import { EventHandler, VdomEventType } from '../dom/events/event.types';

export type VdomNodeType = 'Root' | 'Text' | 'Tag' | 'Keymap' | 'Blank';

export type VdomNode = {
  type: VdomNodeType;
  text?: string;
  tag?: string;
  ref?: Ref;
  keymapKey?: string | number;
  attrs?: VdomTagAttr[];
  eventsMap?: Map<VdomEventType, EventHandler>;
  children?: VdomNode[];
  keymapCtx?: {
    id: string | number;
    nodeMap: Map<string | number, VdomNode>;
    keys: Array<string | number>;
  };
};

export type Ref = { current: DomElem | null };

export type VdomTagAttr = {
  id: string;
  shouldSet: boolean;
  value: string;
};

export type AnyObject = { [key: string]: any };
export type ComponentFunc = (props?: AnyObject) => ComponentResult;

export type ComponentResult = {
  imports?: ComponentFunc[];
  template: string;
  attach?: AnyObject;
};

export type ComponentUnwrapDto = {
  dest: VdomNode[];
  stateLevel: number;
  componentFunc: ComponentFunc;
  props: AnyObject;
  unwrapChildrenCallback?: (dest: VdomNode[]) => boolean;
};

export type ComponentNode = {
  componentId?: string | number;
  componentFunc?: ComponentFunc;
  props?: AnyObject;
  unwrapChildrenCallback?: (dest: VdomNode[]) => boolean;
};

export type ComponentUnwrapperContext = {
  importsMap: Map<string, ComponentFunc>;
  attachMap: Map<string, unknown>;
  unwrapChildrenCallback?: (dest: VdomNode[]) => boolean;
};

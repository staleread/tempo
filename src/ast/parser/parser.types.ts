import { VdomEventType } from '../../dom/events/event.types';

export type AstNodeType =
  | 'Rt'
  | 'Bt'
  | 'Cp'
  | 'Fr'
  | 'If'
  | 'Gt'
  | 'Gc'
  | 'Ij'
  | 'Ch'
  | 'Tx';

export type AstNode = {
  type: AstNodeType;
  id?: StrPtr;
  key?: Var;
  text?: InterStr;
  tagName?: Var;
  compFunc?: Var;
  tagArgs?: {
    attrs: StrAttr[];
    events: EventAttr[];
  };
  loop?: {
    alias: StrPtr;
    items: Var;
  };
  condition?: {
    invert: boolean;
    predicate: Var;
  };
  injection?: {
    value: Var;
    contextKey: Var;
  };
  props?: PropAttr[];
  children?: AstNode[];
};

export type StrAttr = {
  attr: string;
  pos: number;
  strValue: InterStr;
};

export type EventAttr = {
  event: VdomEventType;
  pos: number;
  handler: Var;
};

export type PropAttr = {
  prop: string | '*';
  isSpread: boolean;
  pos: number;
  strValue?: InterStr;
  value?: Var;
};

export type InterStr = Array<StrPtr | Var>;
export type Var = StrPtr[];

export type StrPtr = {
  pos: number;
  str: string;
};

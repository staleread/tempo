import { VdomEventType } from '../../dom/events/event.types';

export type AstNodeType = 'Rt' | 'Bt' | 'Cp' | 'Gt' | 'Gc' | 'Ch' | 'Tx';

export type AstNode = {
  type: AstNodeType;
  id?: StrPtr;
  text?: InterStr;
  tagName?: Var;
  compFunc?: Var;
  stateKey?: Var;
  ref?: Var;
  attrs?: TagAttr[];
  events?: EventAttr[];
  props?: PropAttr[];
  keymapArgs?: KeymapArgs;
  condition?: Condition;
  children?: AstNode[];
};

export type TagArgs = {
  attrs: TagAttr[];
  events: EventAttr[];
};

export type KeymapArgs = {
  alias: StrPtr;
  items: Var;
  key: Var;
};

export type Condition = {
  invert: boolean;
  predicate: Var;
};

export type TagAttr = {
  attr: string;
  pos: number;
  strValue?: InterStr;
  boolValue?: Var;
  boolLiteral?: boolean;
};

export type EventAttr = {
  event: VdomEventType;
  pos: number;
  handler: Var;
  args: Var[];
};

export type PropAttr = {
  prop: string | '*';
  isSpread: boolean;
  pos: number;
  strValue?: InterStr;
  value?: Var;
  boolLiteral?: boolean;
};

export type InterStr = Array<StrPtr | Var>;
export type Var = StrPtr[];

export type StrPtr = {
  pos: number;
  str: string;
};

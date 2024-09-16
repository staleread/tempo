import { VdomEventType } from '../../dom/events/event.types';

export type AstNodeType = 'Rt' | 'Bt' | 'Cp' | 'Gt' | 'Gc' | 'Ch' | 'Tx';

export type AstNode = {
  type: AstNodeType;
  id?: StrPtr;
  text?: InterStr;
  tagName?: Var;
  bind?: Var;
  compFunc?: Var;
  tagArgs?: TagArgs;
  keymapArgs?: KeymapArgs;
  condition?: Condition;
  injections?: InjectionArg[];
  props?: PropAttr[];
  children?: AstNode[];
};

export type TagArgs = {
  attrs: TagAttr[];
  events: EventAttr[];
};

export type KeymapArgs = {
  key: Var;
  alias: StrPtr;
  items: Var;
};

export type Condition = {
  invert: boolean;
  predicate: Var;
};

export type InjectionArg = {
  contextKey: Var;
  value: Var;
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

export type NodeType =
  | 'Rt'
  | 'Tg'
  | 'Bt'
  | 'Cp'
  | 'Cm'
  | 'Mp'
  | 'Mx'
  | 'If'
  | 'Ic'
  | 'Ht'
  | 'Hc'
  | 'Sa'
  | 'Ea'
  | 'Pr'
  | 'Sp'
  | 'Sl'
  | 'Vr'
  | 'Tx'
  | 'Ch';

export type Node = {
  type: NodeType;
  [key: string]: any;
};

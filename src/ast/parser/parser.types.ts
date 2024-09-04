export type NodeType =
  | 'Rt'
  | 'Tg'
  | 'Bt'
  | 'Cp'
  | 'Mp'
  | 'Mx'
  | 'If'
  | 'Ic'
  | 'Ht'
  | 'Hc'
  | 'Ch'
  | 'Cx'
  | 'Sa'
  | 'Ea'
  | 'Pr'
  | 'Sp'
  | 'Sl'
  | 'Vr'
  | 'Tx'
  | 'Ck';

export type Node = {
  type: NodeType;
  [key: string]: any;
};

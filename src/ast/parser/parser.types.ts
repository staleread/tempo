export type NodeType =
  | 'Rt'
  | 'Tg'
  | 'Bt'
  | 'Cp'
  | 'Mp'
  | 'Mx'
  | 'If'
  | 'Ic'
  | 'Gt'
  | 'Gc'
  | 'Ij'
  | 'Cx'
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

export type AstNodeType =
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

export type AstNode = {
  type: AstNodeType;
  [key: string]: any;
};

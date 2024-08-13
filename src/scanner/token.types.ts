export type TokenTypes =
  | 'TEXT'
  | 'OPENING_TAG_START'
  | 'OPENING_TAG_END'
  | 'CLOSING_TAG_START'
  | 'TAG_END'
  | 'IDENTIFIER'
  | 'COMPONENT'
  | 'EVENT'
  | 'KEYWORD'
  | 'ASSIGN'
  | 'STRING'
  | 'ATTACH_START'
  | 'ATTACH_END'
  | 'DOT'
  | 'EOF';

export interface Token {
  type: TokenTypes;
  literal?: string;
}

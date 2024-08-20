export type LexerMode = 'TAG' | 'TXT' | 'VAR' | 'TXT_VAR';

export type TokenType =
  | 'ILLEGAL'
  | 'EOF'
  | 'QUOTE'
  | 'SLASH'
  | 'DOT'
  | 'EQUAL'
  | 'L_ARROW'
  | 'R_ARROW'
  | 'L_CURL'
  | 'R_CURL'
  | 'STR'
  | 'ID'
  | 'COMPONENT'
  | 'EVENT'
  | 'MAP'
  | 'IF'
  | 'AS'
  | 'NOT'
  | 'CHILD';

export type LexerError =
  | 'NO_TOKENS_LEFT'
  | 'ILLEGAL_CHAR_IN_TAG_EXPR'
  | 'ID_MUST_START_WITH_LETTER'
  | 'ILLEGAL_CHAR_IN_ID'
  | 'COMPONENT_MUST_START_WITH_CAPITAL_LETTER'
  | 'EVENT_MUST_START_WITH_LOWER_LETTER'
  | 'KEY_MUST_START_WITH_LOWER_LETTER'
  | 'UNKNOWN_KEYWORD'
  | 'ILLEGAL_CHAR_IN_TXT_EXPR'
  | 'ILLEGAL_CHAR_IN_VAR_EXPR'
  | 'ILLEGAL_CHAR_IN_TXT_VAR_EXPR'
  | 'NOT_IMPLEMENTED';

export interface Token {
  type: TokenType;
  pos: number;
  literal?: string;
  error?: LexerError;
}

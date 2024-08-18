export type LexerState = 'TAG' | 'TXT' | 'VAR' | 'TXT_VAR';

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
  | 'KEY';

export type LexerErrorType =
  | 'NO_TOKENS_LEFT'
  | 'TAG_HAS_ILLEGAL_CHAR'
  | 'ID_MUST_START_WITH_LETTER'
  | 'ID_HAS_ILLEGAL_CHAR'
  | 'COMPONENT_MUST_START_WITH_CAPITAL_LETTER'
  | 'EVENT_MUST_START_WITH_LOWER_LETTER'
  | 'TXT_HAS_ILLEGAL_CHAR'
  | 'VAR_HAS_ILLEGAL_CHAR'
  | 'TXT_VAR_HAS_ILLEGAL_CHAR'
  | 'NOT_IMPLEMENTED';

export interface Token {
  type: TokenType;
  literal?: string;
  error?: LexerErrorType;
}

export interface Lexer {
  context: string;
  state: LexerState;
  buffer: string;
  pos: number;
}

export type LexerStateHandler = (lexer: Lexer) => Token;

export type LexerMode = 'TAG' | 'TXT' | 'VAR' | 'TXT_VAR';

type TransitionTokenType = 'eof' | '<' | '>' | '{' | '}' | '"';

type VarTokenType =
  | '('
  | ')'
  | ','
  | 'dot'
  | 'in'
  | 'by'
  | 'as'
  | 'in'
  | 'true'
  | 'false'
  | 'not'
  | 'vid';

type TextTokenType = 'str';

type TagTokenType =
  | '/'
  | '='
  | '*'
  | 'comp'
  | 'id'
  | 'prop'
  | 'event'
  | 'comment'
  | ':kmap'
  | ':if'
  | ':bind'
  | ':ref'
  | '?comp'
  | '?tag'
  | '#children';

export type TokenType =
  | 'ILLEGAL'
  | TransitionTokenType
  | TextTokenType
  | TagTokenType
  | VarTokenType;

export interface Token {
  type: TokenType;
  pos: number;
  literal?: string;
  error?: string;
}

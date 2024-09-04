export type LexerMode = 'TAG' | 'TXT' | 'VAR' | 'TXT_VAR';

export type TokenType =
  | 'ILLEGAL'
  | 'eof'
  | '<'
  | '>'
  | '{'
  | '}'
  | '"'
  | '/'
  | '='
  | 'dot'
  | 'spread'
  | 'comment'
  | 'str'
  | 'id'
  | 'vid'
  | 'comp'
  | 'prop'
  | 'event'
  | '$map'
  | '$if'
  | '$as'
  | '$not'
  | '$with'
  | '$tag'
  | '$comp'
  | '$children';

export interface Token {
  type: TokenType;
  pos: number;
  literal?: string;
  error?: string;
}

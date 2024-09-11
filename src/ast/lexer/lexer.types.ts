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
  | '$to'
  | '$in'
  | '$if'
  | '$not'
  | '$tag'
  | '$cmp'
  | '$use'
  | '$as'
  | '$children';

export interface Token {
  type: TokenType;
  pos: number;
  literal?: string;
  error?: string;
}

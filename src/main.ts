import { printLexerError } from './lexer/display';
import { readToken } from './lexer/lexer';
import { Lexer, Token } from './lexer/lexer.types';

const text = `
< map cont-ext = " prod" items={ prods} >
  Hello!
  <#MyTag-e @click={handler} />
>c</map>>>`;

var lexer: Lexer = {
  context: 'MyApp',
  state: 'TXT',
  buffer: text,
  pos: 0,
};

var token: Token;

do {
  token = readToken(lexer);
  token.error ? printLexerError(lexer, token) : console.log(token);
} while (token.type !== 'EOF');

import { printLexerError } from './lexer/display';
import { Lexer } from './lexer/lexer';
import { Token } from './lexer/lexer.types';

const text = `
<$map cont-ext = "" $as $revo items={ prods} ></secret>
  Hello! <!-- my first comment  -->
  <MyTag @click={handler} .name={} !-- inline-comment -- />
>c</$map>>>`;

const lexer = new Lexer(text);

do {
  var token = lexer.readToken();
  token.error ? printLexerError(text, token) : console.log(token);
} while (token.type !== 'EOF');

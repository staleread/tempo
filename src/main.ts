import { Lexer } from './lexer/lexer';
import { Token } from './lexer/lexer.types';
import { Logger } from './log/logger';
import { Parser } from './parser/parser';
import { Node } from './parser/parser.types';

const text = `
<div>
  <$map {prods} $as .prod>
    <div class="product">
      <h1>{prod.name}</h1>
      <$if $not {prod.isSecretPrice}>
        <p>{prod.price}</p>
      </$if>
    </div>
  </$map>
</div>`;

const root: Node = {
  type: 'Rt',
  children: [],
};

const logger = new Logger('App', text);
const lexer = new Lexer(text);

const tokens: Token[] = lexer.readTokens();
console.log(tokens);

const parser = new Parser(root, tokens, logger);
const parserResult = parser.run();
console.log(parserResult);
console.dir(root, { depth: null });

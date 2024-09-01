import { Lexer } from './lexer/lexer';
import { Token } from './lexer/lexer.types';
import { Logger } from './log/logger';
import { Parser } from './parser/parser';
import { Node } from './parser/parser.types';

const text = `
<$map {prods} $as .prod>
  <Product .prod={prod} />
</$map>`;

const root: Node = {
  type: 'Rt',
  children: [],
};

const lexer = new Lexer(text);

const tokens: Token[] = lexer.readTokens();
console.log(tokens);

const logger = new Logger('App', text);
const parser = new Parser(root, tokens, logger);
const parserResult = parser.run();
console.log(parserResult);
console.dir(root, { depth: null });

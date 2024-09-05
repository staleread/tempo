import { Logger } from '../log/logger';
import { Lexer } from './lexer/lexer';
import { Token } from './lexer/lexer.types';
import { Parser } from './parser/parser';
import { Node } from './parser/parser.types';

export class AstProvider {
  private readonly cache: Map<string, Node> = new Map();

  public getAst(template: string, logger: Logger): Node {
    const maybeResult: Node | undefined = this.cache.get(template);

    if (maybeResult) {
      return maybeResult;
    }

    const root: Node = {
      type: 'Rt',
      children: [],
    };

    const lexer = new Lexer(template);
    const tokens: Token[] = lexer.readTokens();

    const parser = new Parser(root, tokens, logger);

    if (!parser.run()) {
      throw new Error('Parsing failed');
    }
    this.cache.set(template, root);
    return root;
  }
}

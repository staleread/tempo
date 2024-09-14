import { Logger } from '../log/logger';
import { Lexer } from './lexer/lexer';
import { Token } from './lexer/lexer.types';
import { Parser } from './parser/parser';
import { AstNode } from './parser/parser.types';

export class AstProvider {
  private readonly cache: Map<string, AstNode> = new Map();

  public getAst(template: string, logger: Logger): AstNode {
    const maybeResult: AstNode | undefined = this.cache.get(template);

    if (maybeResult) {
      return maybeResult;
    }

    const root: AstNode = {
      type: 'Rt',
      children: [],
    };

    const lexer = new Lexer(template);
    const tokens: Token[] = lexer.readTokens();

    const parser = new Parser(root, tokens, logger);

    if (!parser.tryParse()) {
      throw new Error('Parsing failed');
    }
    this.cache.set(template, root);
    return root;
  }
}

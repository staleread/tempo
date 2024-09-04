import { Token, TokenType } from '../lexer/lexer.types';
import { Logger } from '../log/logger';
import { Node, NodeType } from './parser.types';

export class Parser {
  private index = 0;
  private isError = false;

  constructor(
    private readonly root: Node,
    private readonly tokens: Token[],
    private readonly logger: Logger,
  ) {}

  private static getExpectedTokenByNode(nodeType: NodeType): TokenType {
    switch (nodeType) {
      case 'Bt':
        return 'id';
      case 'Cp':
        return 'comp';
      case 'Mp':
        return '$map';
      case 'If':
        return '$if';
      case 'Ht':
        return '$tag';
      case 'Hc':
        return '$comp';
      case 'Ch':
        return '$children';
      default:
        return 'ILLEGAL';
    }
  }

  public run(): boolean {
    this.parseText([]);

    if (this.token().type !== '<') {
      this.logUnexpectedToken('<');
      this.panicJumpOver('<');
      this.index--;
    }

    this.parseTag(this.root.children);

    var child = this.root.children[0];

    if (child && child.type !== 'Bt') {
      this.isError = true;
      this.logger.error(child.pos, 'The root tag should be a basic tag');
    }
    this.parseText([]);

    if (this.token().type !== 'eof') {
      this.isError = true;
      this.logger.error(
        this.token().pos,
        'Templete cannot contain more than one root tag',
      );
    }
    return !this.isError;
  }

  private parseTag(dest: Node[]): void {
    this.index++;
    this.skipComments();

    switch (this.token().type) {
      case 'id':
        return this.parseBasicTag(dest);
      case 'comp':
        return this.parseCompTag(dest);
      case '$map':
        return this.parseMapCmd(dest);
      case '$if':
        return this.parseIfCmd(dest);
      case '$tag':
        return this.parseTagCmd(dest);
      case '$comp':
        return this.parseCompCmd(dest);
      case '$children':
        return this.parseChildrenCmd(dest);
      default:
        this.logUnexpectedToken();
        return this.panicJumpOver('>');
    }
  }

  private parseBasicTag(dest: Node[]): void {
    var node: Node = {
      type: 'Bt',
      pos: this.token().pos,
      attrs: [],
      events: [],
      children: [],
    };

    dest.push(node);
    this.parseTagId(node);
    this.parseTagAttrs(node);
    this.parseTagChildren(node);
  }

  private parseCompTag(dest: Node[]): void {
    var node: Node = {
      type: 'Cp',
      pos: this.token().pos,
      props: [],
      children: [],
    };

    dest.push(node);
    this.parseTagId(node);
    this.parseTagAttrs(node);
    this.parseTagChildren(node);
  }

  private parseMapCmd(dest: Node[]): void {
    const context: Node = { type: 'Mx' };

    var node: Node = {
      type: 'Mp',
      pos: this.token().pos,
      context,
      children: [],
    };

    dest.push(node);
    this.parseMapContext(context);
    this.parseTagChildren(node);

    node.children = node.children.filter((c: Node) => c.type !== 'Tx');

    if (node.children.length < 1) {
      this.isError = true;
      this.logger.error(node.pos, 'Map must have one child tag');
      return;
    }
    if (node.children.length > 1) {
      this.isError = true;
      this.logger.error(
        node.children[1].pos,
        'Map must have only one child tag',
      );
      return;
    }
  }

  private parseIfCmd(dest: Node[]): void {
    const condition: Node = { type: 'Ic' };

    var node: Node = {
      type: 'If',
      pos: this.token().pos,
      condition,
      children: [],
    };

    dest.push(node);
    this.parseIfCondition(condition);
    this.parseTagChildren(node);

    node.children = node.children.filter((c: Node) => c.type !== 'Tx');

    if (node.children.length < 1) {
      this.isError = true;
      this.logger.error(node.pos, 'If command must have one child tag');
      return;
    }
    if (node.children.length > 1) {
      this.isError = true;
      this.logger.error(
        node.children[1].pos,
        'If command must have only one child tag',
      );
      return;
    }
  }

  private parseTagCmd(dest: Node[]): void {
    var context: Node = { type: 'Cx' };

    var node: Node = {
      type: 'Ht',
      pos: this.token().pos,
      context,
      attrs: [],
      events: [],
      children: [],
    };

    dest.push(node);
    this.parseTagId(node);
    this.parseContext(node.context);
    this.parseTagAttrs(node);
    this.parseTagChildren(node);

    if (node.children.length > 0) {
      this.isError = true;
      this.logger.error(
        node.children[0].pos,
        'Tag command must not have any children',
      );
      return;
    }
  }

  private parseCompCmd(dest: Node[]): void {
    var context: Node = { type: 'Cx' };

    var node: Node = {
      type: 'Hc',
      pos: this.token().pos,
      context,
      props: [],
      children: [],
    };

    dest.push(node);
    this.parseTagId(node);
    this.parseContext(node.context);
    this.parseTagAttrs(node);
    this.parseTagChildren(node);

    if (node.children.length > 0) {
      this.isError = true;
      this.logger.error(
        node.children[0].pos,
        'Component command must not have any children',
      );
      return;
    }
  }

  private parseChildrenCmd(dest: Node[]): void {
    var node: Node = {
      type: 'Ch',
      pos: this.token().pos,
      children: [],
    };

    dest.push(node);
    this.parseTagId(node);
    this.parseTagAttrs(node);
    this.parseTagChildren(node);

    if (node.children.length > 0) {
      this.isError = true;
      this.logger.error(
        node.children[0].pos,
        'Children command must not have any children',
      );
      return;
    }
  }

  private parseTagId(node: Node): void {
    var expectedType = Parser.getExpectedTokenByNode(node.type);

    if (this.token().type !== expectedType) {
      this.isError = true;
      this.logger.error(
        this.token().pos,
        `Expected ${expectedType} opening tag, got ${this.token().type}`,
      );
      return this.panic();
    }

    if (['Bt', 'Cp'].includes(node.type)) {
      node.id = {
        pos: this.token().pos,
        str: this.token().literal!,
      };
    }
    this.index++;
    this.skipComments();
  }

  private parseTagAttrs(node: Node): void {
    while (!'eof/>'.includes(this.token().type)) {
      switch (this.token().type) {
        case 'id':
          if (node.attrs) {
            this.parseStringAttr(node.attrs);
            continue;
          }
          this.isError = true;
          this.logger.error(
            this.token().pos,
            'String attribute is not allowed here',
          );
          this.parseStringAttr([]);
          continue;
        case 'event':
          if (node.attrs) {
            this.parseEventAttr(node.attrs);
            continue;
          }
          this.isError = true;
          this.logger.error(
            this.token().pos,
            'Event attribute is not allowed here',
          );
          this.parseEventAttr([]);
          continue;
        case 'prop':
          if (node.props) {
            this.parseProp(node.props);
            continue;
          }
          this.isError = true;
          this.logger.error(
            this.token().pos,
            'Property is not allowed here',
          );
          this.parseProp([]);
          continue;
        case 'spread':
          if (node.props) {
            this.parseSpreadProp(node.props);
            continue;
          }
          this.isError = true;
          this.logger.error(
            this.token().pos,
            'Spread property is not allowed here',
          );
          this.parseSpreadProp([]);
          continue;
        case 'comment':
          this.index++;
          continue;
        default:
          this.logUnexpectedToken();
          this.index++;
          continue;
      }
    }
  }

  private parseTagChildren(node: Node): void {
    if (this.token().type === 'eof') {
      return;
    }
    if (this.token().type === '/') {
      this.index++;
      this.skipComments();

      if (this.token().type !== '>') {
        this.logUnexpectedToken('>');
        return this.panicJumpOver('>');
      }
      this.index++;
      return;
    }
    this.index++;
    this.parseText(node.children);

    if (this.token().type !== '<') {
      this.logUnexpectedToken('<');
      this.panicJumpOver('<');
      this.index--;
    }
    this.index++;
    this.skipComments();

    while (!'eof/'.includes(this.token().type)) {
      this.index--;

      this.parseTag(node.children);
      this.parseText(node.children);

      if (this.token().type === 'eof') {
        this.isError = true;
        this.logger.error(node.pos, 'The tag is never closed');
        return;
      }

      if (this.token().type !== '<') {
        this.logUnexpectedToken('<');
        this.panicJumpOver('<');
        this.index--;
      }
      this.index++;
      this.skipComments();
    }
    if (this.token().type === 'eof') {
      this.isError = true;
      this.logger.error(node.pos, 'The tag is never closed');
      return;
    }
    this.index++;
    this.skipComments();

    const tags = ['id', 'comp', '$map', '$if', '$tag', '$comp'];

    if (!tags.includes(this.token().type)) {
      this.logUnexpectedToken();
      return this.panicJumpOver('>');
    }

    var expectedType = Parser.getExpectedTokenByNode(node.type);

    if (this.token().type !== expectedType) {
      this.isError = true;
      this.logger.error(
        this.token().pos,
        `Expected ${expectedType} closing tag, got ${this.token().type}`,
      );
    } else if (this.token().literal !== node.id?.str) {
      this.isError = true;
      this.logger.error(
        this.token().pos,
        'Opening and closing tags do not match',
      );
    }
    this.index++;
    this.skipComments();

    if (this.token().type !== '>') {
      this.logUnexpectedToken('>');
      return this.panicJumpOver('>');
    }
    this.index++;
  }

  private parseMapContext(context: Node): void {
    this.index++;
    this.skipComments();

    if (this.token().type !== '{') {
      this.logUnexpectedToken('{');
      return this.panic();
    }
    this.parseVar(context);
    this.skipComments();

    if (this.token().type !== '$as') {
      this.logUnexpectedToken('$as');
      return this.panic();
    }

    this.index++;
    this.skipComments();

    if (this.token().type !== 'prop') {
      this.logUnexpectedToken('prop');
      return this.panic();
    }

    context.alias = {
      pos: this.token().pos,
      str: this.token().literal!,
    };

    this.index++;
    this.skipComments();

    if (this.token().type !== '>') {
      this.logUnexpectedToken('>');
      return this.panic();
    }
  }

  private parseIfCondition(condition: Node): void {
    this.index++;
    this.skipComments();

    condition.shouldNegate = this.token().type === '$not';

    if (condition.shouldNegate) {
      this.index++;
      this.skipComments();
    }

    if (this.token().type !== '{') {
      this.logUnexpectedToken('{');
      return this.panic();
    }
    this.parseVar(condition);
    this.skipComments();

    if (this.token().type !== '>') {
      this.logUnexpectedToken('>');
      return this.panic();
    }
  }

  private parseContext(context: Node): void {
    if (this.token().type !== '{') {
      this.logUnexpectedToken('{');
      return this.panic();
    }
    this.parseVar(context);
    this.skipComments();

    if (this.token().type !== '$with') {
      this.logUnexpectedToken('$with');
      return this.panic();
    }

    this.index++;
    this.skipComments();
  }

  private parseStringAttr(dest: Node[]): void {
    var node: Node = {
      type: 'Sa',
    };

    node.id = {
      pos: this.token().pos,
      str: this.token().literal,
    };
    this.index++;

    if (this.token().type !== '=') {
      this.logUnexpectedToken('=');
      return this.panic();
    }
    this.index++;

    if (this.token().type !== '"') {
      this.logUnexpectedToken('"');
      return this.panic();
    }
    this.parseStringLiteral(node);

    dest.push(node);
  }

  private parseEventAttr(dest: Node[]): void {
    var node: Node = {
      type: 'Ea',
    };

    node.id = {
      pos: this.token().pos,
      str: this.token().literal,
    };
    this.index++;

    if (this.token().type !== '=') {
      this.logUnexpectedToken('=');
      return this.panic();
    }
    this.index++;

    if (this.token().type !== '{') {
      this.logUnexpectedToken('{');
      return this.panic();
    }
    this.parseVar(node);

    dest.push(node);
  }

  private parseProp(dest: Node[]): void {
    var node: Node = {
      type: 'Pr',
    };

    node.id = {
      pos: this.token().pos,
      str: this.token().literal,
    };
    this.index++;

    if (this.token().type !== '=') {
      this.logUnexpectedToken('=');
      return this.panic();
    }
    this.index++;

    switch (this.token().type) {
      case '{':
        this.parseVar(node);
        break;
      case '"':
        this.parseStringLiteral(node);
        break;
      default:
        this.logUnexpectedToken();
        return this.panic();
    }
    dest.push(node);
  }

  private parseSpreadProp(dest: Node[]): void {
    var node: Node = {
      type: 'Sp',
    };

    this.index++;
    if (this.token().type !== '=') {
      this.logUnexpectedToken('=');
      return this.panic();
    }
    this.index++;

    if (this.token().type !== '{') {
      this.logUnexpectedToken('{');
      return this.panic();
    }
    this.parseVar(node);

    dest.push(node);
  }

  private parseVar(parent: Node): void {
    var node: Node = {
      type: 'Vr',
      vids: [],
    };

    do {
      this.index++;
      if (this.token().type !== 'vid') {
        this.logUnexpectedToken('vid');
        return this.panic();
      }

      node.vids.push({
        pos: this.token().pos,
        str: this.token().literal,
      });
      this.index++;
    } while (this.token().type === 'dot');

    if (this.token().type !== '}') {
      this.logUnexpectedToken('}');
      return this.panic();
    }
    this.index++;
    parent.value = node;
  }

  private parseText(dest: Node[]): void {
    var node: Node = {
      type: 'Tx',
      pos: this.token().pos,
      chunks: [],
    };

    while (this.tryParseChunk(node) || this.trySkipCommentTag()) {}

    if (node.chunks.length > 0) {
      dest.push(node);
    }
  }

  private parseStringLiteral(parent: Node): void {
    var node: Node = {
      type: 'Sl',
      chunks: [],
    };

    this.index++;
    while (this.tryParseChunk(node)) {}

    if (this.token().type !== '"') {
      this.logUnexpectedToken('"');
      return this.panic();
    }
    this.index++;
    parent.strValue = node;
  }

  private tryParseChunk(parent: Node): boolean {
    var node: Node = {
      type: 'Ck',
    };

    switch (this.token().type) {
      case 'str':
        node.str = this.token().literal;
        this.index++;
        break;
      case '{':
        this.parseVar(node);
        break;
      default:
        return false;
    }
    parent.chunks.push(node);
    return true;
  }

  private trySkipCommentTag(): boolean {
    var tmpIndex = this.index;

    if (this.token().type !== '<') {
      return false;
    }
    this.index++;

    if (this.token().type !== 'comment') {
      this.index--;
      return false;
    }
    while (this.token().type === 'comment') {
      this.index++;
    }

    if (this.token().type !== '>') {
      this.index = tmpIndex;
      return false;
    }
    this.index++;
    return true;
  }

  private skipComments(): void {
    while (this.token().type === 'comment') {
      this.index++;
    }
  }

  private panicJumpOver(until: TokenType): void {
    this.isError = true;

    while (![until, 'eof'].includes(this.token().type)) {
      this.index++;
    }
    if (this.token().type !== 'eof') this.index++;
  }

  private panic(): void {
    this.isError = true;
    while (!'eof/>'.includes(this.token().type)) {
      this.index++;
    }
  }

  private logUnexpectedToken(expectedType?: TokenType): void {
    var token = this.token();

    if (token.type === 'ILLEGAL') {
      this.logger.error(token.pos, token.error!);
      return;
    }
    if (!expectedType) {
      this.logger.error(token.pos, 'Unexpected token');
      return;
    }
    this.logger.error(
      token.pos,
      `${expectedType} expected, got ${token.type}`,
    );
  }

  private token(): Token {
    return this.tokens[this.index];
  }
}

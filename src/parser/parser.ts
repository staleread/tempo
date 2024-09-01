import { Token, TokenType } from '../lexer/lexer.types';
import { Logger } from '../log/logger';
import { Node, NodeType } from './parser.types';

export class Parser {
  public nestedRoots: Node[] = [];

  private token: Token;
  private index = -1;
  private isError = false;

  constructor(
    private readonly root: Node,
    private readonly tokens: Token[],
    private readonly logger: Logger,
  ) {}

  public run(): boolean {
    this.index++;
    this.skipText();

    this.parseTag(this.root);
    this.skipText();

    if (this.getToken().type !== 'eof') {
      this.logUnexpectedToken('eof');
      return false;
    }
    return !this.isError;
  }

  private parseTag(parent: Node): void {
    if (this.getToken().type !== '<') {
      this.logUnexpectedToken('<');
      return this.panic();
    }
    this.index++;

    switch (this.getToken().type) {
      case 'id':
        return this.parseBasicTag(parent);
      case 'comp':
        return this.parseCompTag(parent);
      case '$map':
        return this.parseMapCmd(parent);
      case '$if':
        return this.parseIfCmd(parent);
      case '$tag':
        return this.parseTagCmd(parent);
      case '$comp':
        return this.parseCompCmd(parent);
      default:
        this.logUnexpectedToken();
        return this.panic();
    }
  }

  private parseBasicTag(parent: Node): void {
    var node: Node = {
      type: 'Bt',
      attrs: [],
      events: [],
      children: [],
    };

    if (this.getToken().type !== 'id') {
      this.logUnexpectedToken('id');
      return this.panic();
    }
    node.id = this.getToken().literal!;

    this.index++;
    while (!'/>'.includes(this.getToken().type)) {
      switch (this.getToken().type) {
        case 'id':
          this.parseStringAttr(node);
          continue;
        case 'event':
          this.parseEventAttr(node);
          continue;
        default:
          this.logUnexpectedToken();
          return this.panic();
      }
    }

    if (this.getToken().type === '/') {
      this.index++;
      if (this.getToken().type !== '>') {
        this.logUnexpectedToken('>');
        return this.panic();
      }
      this.index++;
      parent.children.push(node);
      return;
    }
    this.index++;
    this.parseText(node);

    if (this.getToken().type !== '<') {
      this.logUnexpectedToken('<');
      return this.panic();
    }
    this.index++;

    while (this.getToken().type !== '/') {
      this.index--;
      this.parseTag(node);
      this.parseText(node);

      if (this.getToken().type !== '<') {
        this.logUnexpectedToken('<');
        return this.panic();
      }
      this.index++;
    }
    this.index++;

    if (this.getToken().type !== 'id') {
      this.logUnexpectedToken('id');
      return this.panic();
    }
    if (this.getToken().literal !== node.id) {
      this.logger.error(
        this.getToken().pos,
        "Closing tag doesn't match the opening one",
      );
      this.isError = true;
    }
    this.index++;

    if (this.getToken().type !== '>') {
      this.logUnexpectedToken('>');
      return this.panic();
    }
    this.index++;

    parent.children.push(node);
  }

  private parseCompTag(parent: Node): void {
    var node: Node = {
      type: 'Cp',
      props: [],
      children: [],
    };

    if (this.getToken().type !== 'comp') {
      this.logUnexpectedToken('comp');
      return this.panic();
    }

    node.id = this.getToken().literal!;
    this.index++;

    while (!'/>'.includes(this.getToken().type)) {
      switch (this.getToken().type) {
        case 'prop':
          this.parseProp(node);
          continue;
        case 'spread':
          this.parseSpreadProp(node);
          continue;
        default:
          this.logUnexpectedToken();
          return this.panic();
      }
    }

    if (this.getToken().type === '/') {
      this.index++;

      if (this.getToken().type !== '>') {
        this.logUnexpectedToken('>');
        return this.panic();
      }
      parent.children.push(node);
      return;
    }
    this.index++;
    this.skipText();

    if (this.getToken().type !== '<') {
      this.logUnexpectedToken('<');
      return this.panic();
    }

    switch (this.getToken().type) {
      case '/':
        this.index -= 2;
        break;
      case 'id':
        this.parseBasicTag(node);
        break;
      case 'comp':
        this.parseCompTag(node);
        break;
      case '$map':
      case '$if':
      case '$tag':
      case '$comp':
        this.logger.error(
          this.getToken().pos,
          'Command tag is not allowed as a component child tag',
        );
        this.index--;
        this.skipTag();
        break;
      default:
        this.logUnexpectedToken();
        return this.panic();
    }
    this.skipText();

    if (this.getToken().type !== '<') {
      this.logUnexpectedToken('<');
      return this.panic();
    }
    this.index++;

    if (this.getToken().type !== '/') {
      this.logUnexpectedToken('/');
      return this.panic();
    }
    this.index++;

    if (this.getToken().type !== 'comp') {
      this.logUnexpectedToken('comp');
      return this.panic();
    }
    if (this.getToken().literal !== node.id) {
      this.logger.error(
        this.getToken().pos,
        "Closing tag doesn't match the opening one",
      );
      this.isError = true;
    }
    this.index++;

    if (this.getToken().type !== '>') {
      this.logUnexpectedToken('>');
      return this.panic();
    }
    this.index++;

    parent.children.push(node);
  }

  private parseMapCmd(parent: Node): void {
    var node: Node = {
      type: 'Mp',
      children: [],
    };

    if (this.getToken().type !== '$map') {
      this.logUnexpectedToken('$map');
      return this.panic();
    }
    this.index++;

    this.parseVar(node);

    if (this.getToken().type !== '$as') {
      this.logUnexpectedToken('$as');
      return this.panic();
    }
    this.index++;

    if (this.getToken().type !== 'prop') {
      this.logUnexpectedToken('prop');
      return this.panic();
    }
    node.alias = this.getToken().literal!;
    this.index++;

    if (this.getToken().type !== '>') {
      this.logUnexpectedToken('>');
      return this.panic();
    }
    this.index++;

    this.skipText();
    this.parseTag(node);
    this.skipText();

    if (this.getToken().type !== '<') {
      this.logUnexpectedToken('<');
      return this.panic();
    }
    this.index++;

    if (this.getToken().type !== '/') {
      this.logUnexpectedToken('/');
      return this.panic();
    }
    this.index++;

    if (this.getToken().type !== '$map') {
      this.logUnexpectedToken('$map');
      return this.panic();
    }
    this.index++;

    if (this.getToken().type !== '>') {
      this.logUnexpectedToken('>');
      return this.panic();
    }
    this.index++;

    parent.children.push(node);
  }

  private parseIfCmd(parent: Node): void {
    var node: Node = {
      type: 'If',
      children: [],
    };

    if (this.getToken().type !== '$if') {
      this.logUnexpectedToken('$if');
      return this.panic();
    }
    this.index++;

    node.shouldNegate = this.getToken().type === '$not';
    if (node.shouldNegate) this.index++;

    this.parseVar(node);

    if (this.getToken().type !== '>') {
      this.logUnexpectedToken('>');
      return this.panic();
    }
    this.index++;

    this.skipText();
    this.parseTag(node);
    this.skipText();

    if (this.getToken().type !== '<') {
      this.logUnexpectedToken('<');
      return this.panic();
    }
    this.index++;

    if (this.getToken().type !== '/') {
      this.logUnexpectedToken('/');
      return this.panic();
    }
    this.index++;

    if (this.getToken().type !== '$if') {
      this.logUnexpectedToken('$if');
      return this.panic();
    }
    this.index++;

    if (this.getToken().type !== '>') {
      this.logUnexpectedToken('>');
      return this.panic();
    }
    this.index++;

    parent.children.push(node);
  }

  private parseTagCmd(parent: Node): void {
    var node: Node = {
      type: 'Ht',
      attrs: [],
      events: [],
      children: [],
    };
    if (this.getToken().type !== '$tag') {
      this.logUnexpectedToken('$tag');
      return this.panic();
    }
    this.index++;

    while (this.getToken().type !== '/') {
      switch (this.getToken().type) {
        case 'id':
          this.parseStringAttr(node);
          continue;
        case 'event':
          this.parseEventAttr(node);
          continue;
        default:
          this.logUnexpectedToken();
          return this.panic();
      }
    }
    this.index++;

    if (this.getToken().type !== '>') {
      this.logUnexpectedToken('>');
      return this.panic();
    }
    this.index++;
    parent.children.push(node);
  }

  private parseCompCmd(parent: Node): void {
    var node: Node = {
      type: 'Hc',
      props: [],
      children: [],
    };
    if (this.getToken().type !== '$comp') {
      this.logUnexpectedToken('$comp');
      return this.panic();
    }
    this.index++;

    while (this.getToken().type !== '/') {
      switch (this.getToken().type) {
        case 'prop':
          this.parseProp(node);
          continue;
        case 'spread':
          this.parseSpreadProp(node);
          continue;
        default:
          this.logUnexpectedToken();
          return this.panic();
      }
    }
    this.index++;
    if (this.getToken().type !== '>') {
      this.logUnexpectedToken('>');
      return this.panic();
    }
    this.index++;
    parent.children.push(node);
  }

  private parseStringAttr(parent: Node): void {
    var node: Node = {
      type: 'Sa',
    };

    if (this.getToken().type !== 'id') {
      this.logUnexpectedToken('id');
      return this.panic();
    }
    node.id = this.getToken().literal;
    this.index++;

    if (this.getToken().type !== '=') {
      this.logUnexpectedToken('=');
      return this.panic();
    }
    this.index++;

    this.parseStringLiteral(node);
    parent.attrs.push(node);
  }

  private parseEventAttr(parent: Node): void {
    var node: Node = {
      type: 'Ea',
    };

    if (this.getToken().type !== 'event') {
      this.logUnexpectedToken('event');
      return this.panic();
    }
    node.id = this.getToken().literal;
    this.index++;

    if (this.getToken().type !== '=') {
      this.logUnexpectedToken('=');
      return this.panic();
    }
    this.index++;

    this.parseVar(node);
    parent.events.push(node);
  }

  private parseProp(parent: Node): void {
    var node: Node = {
      type: 'Pr',
    };

    if (this.getToken().type !== 'prop') {
      this.logUnexpectedToken('prop');
      return this.panic();
    }
    node.id = this.getToken().literal;
    this.index++;

    if (this.getToken().type !== '=') {
      this.logUnexpectedToken('=');
      return this.panic();
    }
    this.index++;

    switch (this.getToken().type) {
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
    parent.props.push(node);
  }

  private parseSpreadProp(parent: Node): void {
    var node: Node = {
      type: 'Sp',
    };

    if (this.getToken().type !== 'spread') {
      this.logUnexpectedToken('spread');
      return this.panic();
    }
    this.index++;

    if (this.getToken().type !== '=') {
      this.logUnexpectedToken('=');
      return this.panic();
    }
    this.index++;

    this.parseVar(node);
    parent.props.push(node);
  }

  private parseVar(parent: Node): void {
    var node: Node = {
      type: 'Vr',
      vids: [],
    };

    if (this.getToken().type !== '{') {
      this.logUnexpectedToken('{');
      return this.panic();
    }

    do {
      this.index++;
      if (this.getToken().type !== 'vid') {
        this.logUnexpectedToken('vid');
        return this.panic();
      }
      node.vids.push(this.getToken().literal);
      this.index++;
    } while (this.getToken().type === 'dot');

    if (this.getToken().type !== '}') {
      this.logUnexpectedToken('}');
      return this.panic();
    }
    this.index++;
    parent.value = node;
  }

  private parseText(parent: Node): void {
    var node: Node = {
      type: 'Tx',
      chunks: [],
    };

    while (this.tryParseChunk(node)) {}

    if (node.chunks.length > 0) {
      parent.children.push(node);
    }
  }

  private tryParseChunk(parent: Node): boolean {
    var node: Node = {
      type: 'Ch',
    };

    switch (this.getToken().type) {
      case 'str':
        node.str = this.getToken().literal;
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

  private parseStringLiteral(parent: Node): void {
    var node: Node = {
      type: 'Sl',
      chunks: [],
    };

    if (this.getToken().type !== '"') {
      this.logUnexpectedToken('"');
      return this.panic();
    }
    this.index++;

    while (this.tryParseChunk(node)) {}

    if (this.getToken().type !== '"') {
      this.logUnexpectedToken('"');
      return this.panic();
    }
    this.index++;
    parent.value = node;
  }

  private skipText(): void {
    const mock: Node = {
      type: 'Rt',
      children: [],
    };
    this.parseText(mock);
  }

  private skipTag(): void {
    const mock: Node = {
      type: 'Rt',
      children: [],
    };
    this.parseTag(mock);
  }

  private isInSync(): boolean {
    switch (this.getToken().type) {
      case 'eof':
      case '<':
        return true;
      default:
        return false;
    }
  }

  private panic(): void {
    this.isError = true;
    if (this.index >= this.tokens.length - 1) return;

    this.index++;
    while (!this.isInSync()) {
      this.index++;
    }
  }

  private logUnexpectedToken(expectedType?: TokenType): void {
    var token = this.getToken();

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

  private getToken(): Token {
    return this.tokens[this.index];
  }
}

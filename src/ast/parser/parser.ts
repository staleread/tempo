import { VdomEventType } from '../../dom/events/event.types';
import { Logger } from '../../log/logger';
import { Token, TokenType } from '../lexer/lexer.types';
import {
  AstNode,
  AstNodeType,
  Condition,
  EventAttr,
  InjectionArg,
  InterStr,
  KeymapArgs,
  PropAttr,
  StrPtr,
  TagArgs,
  TagAttr,
  Var,
} from './parser.types';

export class Parser {
  private index = 0;

  constructor(
    private readonly root: AstNode,
    private readonly tokens: Token[],
    private readonly logger: Logger,
  ) {}

  public tryParse(): boolean {
    let res = true;

    this.skipTextNode();

    res = this.tryParseChildNode(this.root.children!) && res;
    const child = this.root.children![0];

    if (child && child.type !== 'Bt') {
      res = false;
      this.logger.error(
        child.id!.pos,
        'The root tag should be a basic tag',
      );
    }

    this.skipTextNode();
    if (this.token().type !== 'eof') {
      res = false;
      this.logger.error(
        this.token().pos,
        'Templete cannot contain more than one root tag',
      );
    }
    return res;
  }

  private tryParseChildNode(dest: AstNode[]): boolean {
    let res = true;

    if (
      ['str', '{'].includes(this.token().type) &&
      this.tryParseTextNode(dest)
    ) {
      return true;
    }

    if (this.token().type !== '<') {
      res = false;
      this.logUnexpectedToken('<');
      this.panicJumpTo('<');
    }

    this.index++;
    this.skipComments();

    switch (this.token().type) {
      case 'id':
        res = this.tryParseBasicTag(dest) && res;
        break;
      case 'comp':
        res = this.tryParseCompTag(dest) && res;
        break;
      case '#tag':
        res = this.tryParseGenTag(dest) && res;
        break;
      case '#cmp':
        res = this.tryParseGenCompTag(dest) && res;
        break;
      case '#children':
        res = this.tryParseChildrenTag(dest) && res;
        break;
      case '/':
        return true;
      default:
        this.logUnexpectedToken();
        this.panicJumpOver('>');
        return false;
    }
    return res;
  }

  private tryParseBasicTag(dest: AstNode[]): boolean {
    let res = true;

    const id = {
      pos: this.token().pos,
      str: this.token().literal!,
    };
    this.index++;
    this.skipComments();

    const node: AstNode = {
      type: 'Bt',
      id,
    };

    res = this.tryParseTagLikeMetadata(node) && res;
    res = this.tryParseChildren(node) && res;

    if (res) dest.push(node);
    return res;
  }

  private tryParseGenTag(dest: AstNode[]): boolean {
    let res = true;

    const id = {
      pos: this.token().pos,
      str: this.token().type,
    };
    this.index++;
    this.skipComments();

    const node: AstNode = {
      type: 'Gt',
      id,
    };

    res = this.tryParseTagLikeMetadata(node) && res;
    res = this.tryParseChildren(node) && res;

    if (res) dest.push(node);
    return res;
  }

  private tryParseCompTag(dest: AstNode[]): boolean {
    let res = true;

    const id = {
      pos: this.token().pos,
      str: this.token().literal!,
    };
    this.index++;
    this.skipComments();

    const node: AstNode = {
      type: 'Cp',
      id,
    };

    res = this.tryParseCompLikeMetadata(node) && res;
    res = this.tryParseChildren(node) && res;

    if (res) dest.push(node);
    return res;
  }

  private tryParseGenCompTag(dest: AstNode[]): boolean {
    let res = true;

    const id = {
      pos: this.token().pos,
      str: this.token().type,
    };
    this.index++;
    this.skipComments();

    const node: AstNode = {
      type: 'Gc',
      id,
    };

    res = this.tryParseCompLikeMetadata(node) && res;
    res = this.tryParseChildren(node) && res;

    if (res) dest.push(node);
    return res;
  }

  private tryParseChildrenTag(dest: AstNode[]): boolean {
    let res = true;

    const id = {
      pos: this.token().pos,
      str: this.token().type,
    };
    this.index++;
    this.skipComments();

    const node: AstNode = {
      type: 'Ch',
      id,
    };

    res = this.tryParseChildren(node) && res;

    const children: AstNode[] | undefined = node.children;

    if (children && children.length > 0) {
      res = false;
      const child: AstNode = children[0]!;

      let pos: number;

      if (child.id) {
        pos = child.id.pos;
      } else {
        if (!child.text) {
          throw new Error('AstNode must contain either id or text field');
        }
        const firstLiteral: StrPtr | undefined = Array.isArray(
          child.text[0],
        )
          ? child.text[0][0]
          : child.text[0];

        if (!firstLiteral) {
          throw new Error('StrPtr must contain at least one child');
        }
        pos = firstLiteral.pos;
      }

      this.logger.error(
        pos,
        'Children tag does not support any children tags',
      );
    }

    if (res) dest.push(node);
    return res;
  }

  private tryParseTagLikeMetadata(node: AstNode): boolean {
    let res = true;

    if (node.type === 'Gt') {
      node.tagName = [];
      res = this.tryParseVar(node.tagName!) && res;
    }

    node.tagArgs = { attrs: [], events: [] };
    res = this.tryParseTagArgs(node.id!.str, node.tagArgs!) && res;

    this.skipComments();
    let hasCommand = false;

    while (!'eof/>'.includes(this.token().type)) {
      switch (this.token().type) {
        case '$bind':
          if (hasCommand) {
            this.logger.error(
              node.id!.pos,
              'Exeeded the limit of inline commands inside a tag',
            );
            return false;
          }
          hasCommand = true;

          node.bind = [];
          res = this.tryParseBind(node.bind) && res;
          continue;
        case '$map':
          if (hasCommand) {
            this.logger.error(
              node.id!.pos,
              'Exeeded the limit of inline commands inside a tag',
            );
            return false;
          }
          hasCommand = true;

          node.keymapArgs = {
            key: [],
            alias: { pos: -1, str: '' },
            items: [],
          };
          res = this.tryParseKeymapArgs(node.keymapArgs!) && res;
          continue;
        case '$if':
          if (hasCommand) {
            this.logger.error(
              node.id!.pos,
              'Exeeded the limit of inline commands inside a tag',
            );
            return false;
          }
          hasCommand = true;

          node.condition = {
            invert: false,
            predicate: [],
          };
          res = this.tryParseCondition(node.condition!) && res;
          continue;
        case '$set':
          this.logger.error(
            this.token().pos,
            '$set statement is not supported in tag-like tags',
          );
          this.panicInsideTag();
          return false;
        default:
          res = false;
          this.logUnexpectedToken();
          this.panicInsideTag();
          continue;
      }
    }
    return res;
  }

  private tryParseCompLikeMetadata(node: AstNode): boolean {
    let res = true;

    if (node.type === 'Gc') {
      node.compFunc = [];
      res = this.tryParseVar(node.compFunc!) && res;
    }
    node.props = [];
    res = this.tryParseProps(node.props!) && res;

    let hasCommand = false;

    while (!'eof/>'.includes(this.token().type)) {
      switch (this.token().type) {
        case '$bind':
          if (hasCommand) {
            this.logger.error(
              node.id!.pos,
              'Exeeded the limit of inline commands inside a tag',
            );
            return false;
          }
          hasCommand = true;

          node.bind = [];
          res = this.tryParseBind(node.bind!) && res;
          continue;
        case '$map':
          if (hasCommand) {
            this.logger.error(
              node.id!.pos,
              'Exeeded the limit of inline commands inside a tag',
            );
            return false;
          }
          hasCommand = true;

          node.keymapArgs = {
            key: [],
            alias: { pos: -1, str: '' },
            items: [],
          };
          res = this.tryParseKeymapArgs(node.keymapArgs!) && res;
          continue;
        case '$if':
          if (hasCommand) {
            this.logger.error(
              node.id!.pos,
              'Exeeded the limit of inline commands inside a tag',
            );
            return false;
          }
          hasCommand = true;

          node.condition = {
            invert: false,
            predicate: [],
          };
          res = this.tryParseCondition(node.condition!) && res;
          continue;
        case '$set':
          if (!node.injections) {
            node.injections = [];
          }
          res = this.tryParseInjection(node.injections) && res;
          continue;
        default:
          res = false;
          this.logUnexpectedToken();
          this.panicInsideTag();
          break;
      }
    }
    return res;
  }

  private tryParseChildren(node: AstNode): boolean {
    let res = true;

    node.children = [];

    if (this.token().type === 'eof') {
      this.logUnexpectedToken();
      return false;
    }
    if (this.token().type === '/') {
      this.index++;
      this.skipComments();

      if (this.token().type !== '>') {
        this.logUnexpectedToken('>');
        this.panicJumpOver('>');
        return false;
      }
      this.index++;
      return res;
    }
    this.index++;

    while (!'eof/'.includes(this.token().type)) {
      res = this.tryParseChildNode(node.children!) && res;
    }

    if (this.token().type === 'eof') {
      this.logger.error(node.id!.pos, 'The tag is never closed');
      return false;
    }
    this.index++;
    this.skipComments();

    if (this.token().literal !== node.id!.str) {
      res = false;
      this.logger.error(
        this.token().pos,
        `Opening and closing tags do not match. </${node.id!.str}> expected`,
      );
    }

    this.index++;
    this.skipComments();

    if (this.token().type !== '>') {
      this.logUnexpectedToken('>');
      this.panicJumpOver('>');
      return false;
    }
    this.index++;

    return res;
  }

  private tryParseTagArgs(nodeId: string, args: TagArgs): boolean {
    let res = true;

    while (['event', 'id'].includes(this.token().type)) {
      if (this.token().type === 'event') {
        res = this.tryParseEventAttr(nodeId, args.events) && res;
        continue;
      }
      res = this.tryParseTagAttr(args.attrs) && res;
    }
    return res;
  }

  private tryParseProps(props: PropAttr[]): boolean {
    let res = true;

    while (['spread', 'prop'].includes(this.token().type)) {
      if (this.token().type === 'spread') {
        res = this.tryParseSpreadPropAttr(props) && res;
        continue;
      }
      res = this.tryParsePropAttr(props) && res;
    }
    return res;
  }

  private tryParseKeymapArgs(args: KeymapArgs): boolean {
    this.index++;

    if (!this.tryParseVar(args.key)) {
      return false;
    }

    if (this.token().type === 'prop') {
      args.alias = {
        pos: this.token().pos,
        str: this.token().literal!,
      };
      this.index++;
      this.skipComments();
    } else {
      this.logUnexpectedToken('prop');
      this.panicInsideTag();
      return false;
    }

    return this.tryParseVar(args.items);
  }

  private tryParseCondition(condition: Condition): boolean {
    this.index++;

    switch (this.token().type) {
      case ':yes':
        condition.invert = false;
        break;
      case ':no':
        condition.invert = true;
        break;
      default:
        this.logger.error(this.token().pos, ':yes or :no expected');
        this.panicInsideTag();
        return false;
    }
    this.index++;
    this.skipComments();

    return this.tryParseVar(condition.predicate);
  }

  private tryParseInjection(dest: InjectionArg[]): boolean {
    this.index++;

    const injection: InjectionArg = {
      contextKey: [],
      value: [],
    };

    if (!this.tryParseVar(injection.contextKey)) {
      return false;
    }

    if (!this.tryParseVar(injection.value)) {
      return false;
    }

    dest.push(injection);
    return true;
  }

  private tryParseTagAttr(dest: TagAttr[]): boolean {
    let res = true;

    const attr = this.token().literal!;
    const pos = this.token().pos;

    this.index++;
    this.skipComments();

    if (this.token().type !== '=') {
      this.logUnexpectedToken('=');
      this.panicInsideTag();
      return false;
    }

    this.index++;
    this.skipComments();

    let strValue: InterStr | undefined;
    let boolValue: Var | undefined;
    let boolLiteral: boolean | undefined;

    switch (this.token().type) {
      case ':yes':
        this.index++;
        this.skipComments();

        boolLiteral = true;
        break;
      case ':no':
        this.index++;
        this.skipComments();

        boolLiteral = false;
        break;
      case '{':
        boolValue = [];
        res = this.tryParseVar(boolValue) && res;
        break;
      case '"':
        strValue = [];
        res = this.tryParseStringLiteral(strValue) && res;
        break;
      default:
        this.logUnexpectedToken();
        this.panicInsideTag();
        return false;
    }
    if (res) dest.push({ attr, pos, strValue, boolValue, boolLiteral });
    return res;
  }

  private tryParseEventAttr(nodeId: string, dest: EventAttr[]): boolean {
    let res = true;

    const event = this.token().literal! as VdomEventType;
    const pos = this.token().pos;

    switch (event) {
      case 'click':
      case 'submit':
        break;
      case 'change':
      case 'input':
      case 'blur':
        if (nodeId !== 'input') {
          res = false;
          this.logger.error(
            pos,
            'The event is only supported by explicit <input> tag',
          );
        }
        break;
      default:
        res = false;
        this.logger.error(pos, 'Unsupported event');
        break;
    }

    this.index++;
    this.skipComments();

    if (this.token().type !== '=') {
      this.logUnexpectedToken('=');
      this.panicInsideTag();
      return false;
    }

    this.index++;
    this.skipComments();

    const handler: Var = [];
    res = this.tryParseVar(handler) && res;

    if (res) dest.push({ event, pos, handler });
    return res;
  }

  private tryParsePropAttr(dest: PropAttr[]): boolean {
    let res = true;

    const prop = this.token().literal!;
    const pos = this.token().pos;

    this.index++;
    this.skipComments();

    if (this.token().type !== '=') {
      this.logUnexpectedToken('=');
      this.panicInsideTag();
      return false;
    }

    this.index++;
    this.skipComments();

    let strValue: InterStr | undefined;
    let value: Var | undefined;
    let boolLiteral: boolean | undefined;

    switch (this.token().type) {
      case ':yes':
        this.index++;
        this.skipComments();

        boolLiteral = true;
        break;
      case ':no':
        this.index++;
        this.skipComments();

        boolLiteral = false;
        break;
      case '"':
        strValue = [];
        res = this.tryParseStringLiteral(strValue) && res;
        break;
      case '{':
        value = [];
        res = this.tryParseVar(value) && res;
        break;
      default:
        this.logUnexpectedToken();
        this.panicInsideTag();
        return false;
    }
    if (res)
      dest.push({
        prop,
        isSpread: false,
        pos,
        strValue,
        value,
        boolLiteral,
      });
    return res;
  }

  private tryParseSpreadPropAttr(dest: PropAttr[]): boolean {
    let res = true;

    const prop = '*';
    const pos = this.token().pos;

    this.index++;
    this.skipComments();

    if (this.token().type !== '=') {
      this.logUnexpectedToken('=');
      this.panicInsideTag();
      return false;
    }

    this.index++;
    this.skipComments();

    const value: Var = [];
    res = this.tryParseVar(value) && res;

    if (res) dest.push({ prop, isSpread: true, pos, value });
    return res;
  }

  private tryParseStringLiteral(dest: InterStr): boolean {
    if (this.token().type !== '"') {
      this.logUnexpectedToken('"');
      this.panicInsideTag();

      return false;
    }
    this.index++;

    while (this.tryParseChunk(dest)) {}

    if (this.token().type !== '"') {
      this.logUnexpectedToken('"');
      return false;
    }
    this.index++;
    this.skipComments();
    return true;
  }

  private tryParseBind(bind: Var): boolean {
    this.index++;
    this.skipComments();

    return this.tryParseVar(bind);
  }

  private tryParseVar(dest: Var): boolean {
    if (this.token().type !== '{') {
      this.logUnexpectedToken('{');
      this.panicInsideTag();
      return false;
    }

    do {
      this.index++;
      if (this.token().type !== 'vid') {
        this.logUnexpectedToken('vid');
        this.panicInsideTag();
        return false;
      }

      dest.push({
        pos: this.token().pos,
        str: this.token().literal!,
      });
      this.index++;
    } while (this.token().type === 'dot');

    if (this.token().type !== '}') {
      this.logUnexpectedToken('}');
      this.panicInsideTag();
      return false;
    }
    this.index++;
    this.skipComments();
    return true;
  }

  private tryParseTextNode(dest: AstNode[]): boolean {
    const node: AstNode = {
      type: 'Tx',
      text: [],
    };

    while (this.tryParseChunk(node.text!) || this.trySkipCommentTag()) {}

    if (node.text!.length > 0) {
      dest.push(node);
      return true;
    }
    return false;
  }

  private tryParseChunk(dest: InterStr): boolean {
    switch (this.token().type) {
      case 'str':
        dest.push({
          pos: this.token().pos,
          str: this.token().literal!,
        });
        this.index++;
        return true;
      case '{':
        const value: Var = [];
        const res = this.tryParseVar(value);
        if (res) dest.push(value);
        return res;
      default:
        return false;
    }
  }

  private trySkipCommentTag(): boolean {
    const tmpIndex = this.index;

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

  private skipTextNode(): void {
    while (this.tryParseChunk([]) || this.trySkipCommentTag()) {}
  }

  private skipComments(): void {
    while (this.token().type === 'comment') {
      this.index++;
    }
  }

  private panicJumpOver(tokenType: TokenType): void {
    while (![tokenType, 'eof'].includes(this.token().type)) {
      this.index++;
    }
    if (this.token().type !== 'eof') this.index++;
  }

  private panicJumpTo(tokenType: TokenType): void {
    while (![tokenType, 'eof'].includes(this.token().type)) {
      this.index++;
    }
  }

  private panicInsideTag(): void {
    while (!'eof/>'.includes(this.token().type)) {
      this.index++;
    }
  }

  private logUnexpectedToken(expectedType?: TokenType): void {
    const token = this.token();

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
    const token: Token | undefined = this.tokens[this.index];

    if (!token) {
      throw new RangeError();
    }
    return token;
  }
}

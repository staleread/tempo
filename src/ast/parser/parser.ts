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
    if (!this.root.children) {
      throw new Error('Root node must have children defined');
    }

    this.skipTextNode();

    if (!this.tryParseChildNode(this.root.children)) {
      return false;
    }

    const child = this.root.children[0]!;

    if (
      (child.keymapArgs && child.keymapArgs.key.length > 0) ||
      (child.condition && child.condition.predicate.length > 0)
    ) {
      this.logger.error(
        child.id!.pos,
        'The root tag must not contain :kmap or :if commands',
      );
      return false;
    }

    this.skipTextNode();

    if (this.token().type !== 'eof') {
      this.logger.error(
        this.token().pos,
        'Templete cannot contain more than one root tag',
      );
      return false;
    }
    return true;
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
      case '?tag':
        res = this.tryParseGenTag(dest) && res;
        break;
      case '?comp':
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
      ref: [],
      attrs: [],
      events: [],
      keymapArgs: {
        key: [],
        alias: { pos: -1, str: '' },
        items: [],
      },
      condition: {
        invert: false,
        predicate: [],
      },
      children: [],
    };

    res = this.tryParseMetadata(node) && res;
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
      tagName: [],
      ref: [],
      attrs: [],
      events: [],
      keymapArgs: {
        key: [],
        alias: { pos: -1, str: '' },
        items: [],
      },
      condition: {
        invert: false,
        predicate: [],
      },
      children: [],
    };

    res = this.tryParseMetadata(node) && res;
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
      stateKey: [],
      props: [],
      keymapArgs: {
        key: [],
        alias: { pos: -1, str: '' },
        items: [],
      },
      condition: {
        invert: false,
        predicate: [],
      },
      injections: [],
      children: [],
    };

    res = this.tryParseMetadata(node) && res;
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
      compFunc: [],
      stateKey: [],
      props: [],
      keymapArgs: {
        key: [],
        alias: { pos: -1, str: '' },
        items: [],
      },
      condition: {
        invert: false,
        predicate: [],
      },
      injections: [],
      children: [],
    };

    res = this.tryParseMetadata(node) && res;
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

    // reading children for better error recovery
    const node: AstNode = {
      type: 'Ch',
      id,
      children: [],
    };

    res = this.tryParseChildren(node) && res;

    const childrenCount = node.children!.length;

    if (childrenCount > 0) {
      this.logger.error(
        id.pos,
        `Children tag must have no children tags, got ${childrenCount}`,
      );
      return false;
    }

    if (res) dest.push(node);
    return res;
  }

  private tryParseMetadata(node: AstNode): boolean {
    let res = true;
    let hasCommand = false;

    while (!'eof/>'.includes(this.token().type)) {
      switch (this.token().type) {
        case 'id':
          if (!node.attrs) {
            this.logger.error(
              node.id!.pos,
              'The attribute is not allowed here',
            );
            return false;
          }
          res = this.tryParseTagAttr(node.attrs) && res;
          continue;
        case 'event':
          if (!node.events) {
            this.logger.error(
              node.id!.pos,
              'The event is not allowed here',
            );
            return false;
          }
          res = this.tryParseEventAttr(node.id!.str!, node.events) && res;
          continue;
        case 'prop':
          if (!node.props) {
            this.logger.error(node.id!.pos, 'The prop is not allowed here');
            return false;
          }
          res = this.tryParsePropAttr(node.props) && res;
          continue;
        case '*':
          if (!node.props) {
            this.logger.error(
              node.id!.pos,
              'The spread prop is not allowed here',
            );
            return false;
          }
          res = this.tryParseSpreadPropAttr(node.props) && res;
          continue;
        case ':kmap':
          if (!node.keymapArgs) {
            this.logger.error(
              node.id!.pos,
              'The command is not allowed here',
            );
            return false;
          }
          if (hasCommand) {
            this.logger.error(
              node.id!.pos,
              'The command is a conflicting one',
            );
            return false;
          }
          hasCommand = true;
          res = this.tryParseKeymapArgs(node.keymapArgs) && res;
          continue;
        case ':if':
          if (!node.condition) {
            this.logger.error(
              node.id!.pos,
              'The command is not allowed here',
            );
            return false;
          }
          if (hasCommand) {
            this.logger.error(
              node.id!.pos,
              'The command is a conflicting one',
            );
            return false;
          }
          hasCommand = true;
          res = this.tryParseCondition(node.condition) && res;
          continue;
        case ':bind':
          if (!node.stateKey) {
            this.logger.error(
              node.id!.pos,
              'The command is not allowed here',
            );
            return false;
          }
          if (hasCommand) {
            this.logger.error(
              node.id!.pos,
              'The command is a conflicting one',
            );
            return false;
          }
          hasCommand = true;
          res = this.tryParseStateKey(node.stateKey);
          continue;
        case ':ref':
          if (!node.ref) {
            this.logger.error(
              node.id!.pos,
              'The command is not allowed here',
            );
            return false;
          }
          if (hasCommand) {
            this.logger.error(
              node.id!.pos,
              'The command is a conflicting one',
            );
            return false;
          }
          hasCommand = true;
          res = this.tryParseRef(node.ref);
          continue;
        case ':use':
          if (!node.injections) {
            this.logger.error(
              node.id!.pos,
              'The command is not allowed here',
            );
            return false;
          }
          res = this.tryParseInjection(node.injections) && res;
          continue;
        default:
          res = false;
          this.logUnexpectedToken();
          this.panicInsideTag();
          continue;
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

  private tryParseKeymapArgs(args: KeymapArgs): boolean {
    this.index++;

    if (!this.tryReadExpectedTokenInsideTag('=')) {
      return false;
    }
    if (!this.tryReadExpectedTokenInsideTag('{')) {
      return false;
    }
    if (this.token().type === 'vid') {
      args.alias = {
        pos: this.token().pos,
        str: this.token().literal!,
      };
    } else {
      this.logUnexpectedToken('vid');
      this.panicInsideTag();
      return false;
    }
    this.index++;

    if (!this.tryReadExpectedTokenInsideTag('in')) {
      return false;
    }
    if (!this.tryParseVar(args.items)) {
      return false;
    }
    if (!this.tryReadExpectedTokenInsideTag('by')) {
      return false;
    }
    if (!this.tryParseVar(args.key)) {
      return false;
    }
    if (!this.tryReadExpectedTokenInsideTag('}')) {
      return false;
    }
    this.skipComments();
    return true;
  }

  private tryParseCondition(condition: Condition): boolean {
    this.index++;

    if (!this.tryReadExpectedTokenInsideTag('=')) {
      return false;
    }
    if (!this.tryReadExpectedTokenInsideTag('{')) {
      return false;
    }
    if (this.token().type === 'not') {
      condition.invert = true;
      this.index++;
    }
    if (!this.tryParseVar(condition.predicate)) {
      return false;
    }
    if (!this.tryReadExpectedTokenInsideTag('}')) {
      return false;
    }
    this.skipComments();
    return true;
  }

  private tryParseInjection(dest: InjectionArg[]): boolean {
    const injection: InjectionArg = {
      contextKey: [],
      value: [],
    };

    this.index++;

    if (!this.tryReadExpectedTokenInsideTag('=')) {
      return false;
    }
    if (!this.tryReadExpectedTokenInsideTag('{')) {
      return false;
    }
    if (!this.tryParseVar(injection.value)) {
      return false;
    }
    if (!this.tryReadExpectedTokenInsideTag('as')) {
      return false;
    }
    if (!this.tryParseVar(injection.contextKey)) {
      return false;
    }
    if (!this.tryReadExpectedTokenInsideTag('}')) {
      return false;
    }

    dest.push(injection);

    this.skipComments();
    return true;
  }

  private tryParseStateKey(bind: Var): boolean {
    this.index++;
    this.skipComments();

    if (!this.tryReadExpectedTokenInsideTag('=')) {
      return false;
    }
    if (!this.tryReadExpectedTokenInsideTag('{')) {
      return false;
    }
    if (!this.tryParseVar(bind)) {
      return false;
    }
    if (!this.tryReadExpectedTokenInsideTag('}')) {
      return false;
    }

    this.skipComments();
    return true;
  }

  private tryParseRef(ref: Var): boolean {
    this.index++;
    this.skipComments();

    if (!this.tryReadExpectedTokenInsideTag('=')) {
      return false;
    }
    if (!this.tryReadExpectedTokenInsideTag('{')) {
      return false;
    }
    if (!this.tryParseVar(ref)) {
      return false;
    }
    if (!this.tryReadExpectedTokenInsideTag('}')) {
      return false;
    }

    this.skipComments();
    return true;
  }

  private tryParseTagAttr(dest: TagAttr[]): boolean {
    const attr = this.token().literal!;
    const pos = this.token().pos;

    this.index++;

    if (!this.tryReadExpectedTokenInsideTag('=')) {
      return false;
    }

    let strValue: InterStr | undefined;
    let boolValue: Var | undefined;
    let boolLiteral: boolean | undefined;

    if (this.token().type === '"') {
      strValue = [];

      if (!this.tryParseStringLiteral(strValue)) {
        return false;
      }

      dest.push({ attr, pos, strValue });
      return true;
    } else if (this.token().type !== '{') {
      this.logger.error(
        this.token().pos,
        'String literal or value refernce expected',
      );
      return false;
    }
    if (this.token().type === 'true') {
      boolLiteral = true;
      this.index++;
    } else if (this.token().type === 'false') {
      boolLiteral = false;
      this.index++;
    } else {
      boolValue = [];
      if (!this.tryParseVar(boolValue)) {
        return false;
      }
    }
    if (!this.tryReadExpectedTokenInsideTag('}')) {
      return false;
    }
    dest.push({ attr, pos, boolValue, boolLiteral });
    return true;
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

    if (!this.tryReadExpectedTokenInsideTag('=')) {
      return false;
    }
    if (!this.tryReadExpectedTokenInsideTag('{')) {
      return false;
    }

    const handler: Var = [];

    if (!this.tryParseVar(handler)) {
      return false;
    }
    if (!this.tryReadExpectedTokenInsideTag('}')) {
      return false;
    }

    if (res) dest.push({ event, pos, handler });
    return res;
  }

  private tryParsePropAttr(dest: PropAttr[]): boolean {
    const prop = this.token().literal!;
    const pos = this.token().pos;

    this.index++;

    if (!this.tryReadExpectedTokenInsideTag('=')) {
      return false;
    }

    let strValue: InterStr | undefined;
    let value: Var | undefined;
    let boolLiteral: boolean | undefined;

    if (this.token().type === '"') {
      strValue = [];

      if (!this.tryParseStringLiteral(strValue)) {
        return false;
      }

      dest.push({ prop, isSpread: false, pos, strValue });
      return true;
    } else if (this.token().type !== '{') {
      this.logger.error(
        this.token().pos,
        'String literal or value refernce expected',
      );
      return false;
    }
    if (this.token().type === 'true') {
      boolLiteral = true;
      this.index++;
    } else if (this.token().type === 'false') {
      boolLiteral = false;
      this.index++;
    } else {
      value = [];
      if (!this.tryParseVar(value)) {
        return false;
      }
    }
    if (!this.tryReadExpectedTokenInsideTag('}')) {
      return false;
    }

    dest.push({ prop, isSpread: false, pos, value, boolLiteral });
    return true;
  }

  private tryParseSpreadPropAttr(dest: PropAttr[]): boolean {
    const prop = '*';
    const pos = this.token().pos;

    this.index++;

    if (!this.tryReadExpectedTokenInsideTag('=')) {
      return false;
    }
    if (!this.tryReadExpectedTokenInsideTag('{')) {
      return false;
    }

    const value: Var = [];

    if (!this.tryParseVar(value)) {
      return false;
    }
    if (!this.tryReadExpectedTokenInsideTag('}')) {
      return false;
    }

    dest.push({ prop, isSpread: true, pos, value });
    return true;
  }

  private tryParseStringLiteral(dest: InterStr): boolean {
    if (!this.tryReadExpectedTokenInsideTag('"')) {
      return false;
    }

    while (this.tryParseChunk(dest)) {}

    if (!this.tryReadExpectedTokenInsideTag('"')) {
      return false;
    }

    this.skipComments();
    return true;
  }

  private tryParseVar(dest: Var): boolean {
    this.index--;

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

  private tryReadExpectedTokenInsideTag(tokenType: TokenType) {
    if (this.token().type !== tokenType) {
      this.logUnexpectedToken(tokenType);
      this.panicInsideTag();
      return false;
    }

    this.index++;
    return true;
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

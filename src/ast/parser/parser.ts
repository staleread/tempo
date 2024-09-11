import { VdomEventType } from '../../dom/events/event.types';
import { Logger } from '../../log/logger';
import { Token, TokenType } from '../lexer/lexer.types';
import {
  AstNode,
  AstNodeType,
  ConditionArgs,
  EventAttr,
  InjectionArg,
  InterStr,
  KeymapArgs,
  PropAttr,
  StrAttr,
  StrPtr,
  TagArgs,
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
      case '$tag':
        res = this.tryParseGenTag(dest) && res;
        break;
      case '$cmp':
        res = this.tryParseGenCompTag(dest) && res;
        break;
      case '$children':
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

    if (node.children && node.children.length > 0) {
      res = false;
      const child = node.children[0];
      const pos: number = child.id
        ? child.id.pos
        : Array.isArray(child.text![0])
          ? child.text![0][0].pos
          : child.text![0].pos;

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
    let hasIfOrKeymaps = false;

    while (!'eof/>'.includes(this.token().type)) {
      switch (this.token().type) {
        case '$map':
          if (hasIfOrKeymaps) {
            this.logger.error(
              node.id!.pos,
              'Cannot accept both $if and $map or more than one of them',
            );
            return false;
          }
          hasIfOrKeymaps = true;

          node.keymapArgs = {
            key: [],
            items: [],
            alias: { pos: -1, str: '' },
          };
          res = this.tryParseKeymapArgs(node.keymapArgs!) && res;
          continue;
        case '$if':
          if (hasIfOrKeymaps) {
            this.logger.error(
              node.id!.pos,
              'Cannot accept both $if and $map or more than one of them',
            );
            return false;
          }
          hasIfOrKeymaps = true;
          node.condition = {
            invert: false,
            predicate: [],
          };
          res = this.tryParseCondition(node.condition!) && res;
          continue;
        case '$use':
          this.logger.error(
            this.token().pos,
            '$use statement is not supported in tag-like tags',
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

    let hasIfOrKeymaps = false;

    while (!'eof/>'.includes(this.token().type)) {
      switch (this.token().type) {
        case '$map':
          if (hasIfOrKeymaps) {
            this.logger.error(
              node.id!.pos,
              'Cannot accept both $if and $map or more than one of them',
            );
            return false;
          }
          hasIfOrKeymaps = true;
          node.keymapArgs = {
            key: [],
            items: [],
            alias: { pos: -1, str: '' },
          };
          res = this.tryParseKeymapArgs(node.keymapArgs!) && res;
          break;
        case '$if':
          if (hasIfOrKeymaps) {
            this.logger.error(
              node.id!.pos,
              'Cannot accept both $if and $map or more than one of them',
            );
            return false;
          }
          hasIfOrKeymaps = true;
          node.condition = {
            invert: false,
            predicate: [],
          };
          res = this.tryParseCondition(node.condition!) && res;
          break;
        case '$use':
          node.injections = [];
          res = this.tryParseInjections(node.injections!) && res;
          break;
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
      res = this.tryParseStringAttr(args.attrs) && res;
    }
    return res;
  }

  private tryParseProps(props: PropAttr[]): boolean {
    let res = true;

    while (['spread', 'prop'].includes(this.token().type)) {
      res = this.tryParsePropAttr(props) && res;
    }
    return res;
  }

  private tryParseKeymapArgs(keymapArgs: KeymapArgs): boolean {
    this.index++;

    if (!this.tryParseVar(keymapArgs.key)) {
      return false;
    }

    if (this.token().type === '$to') {
      this.index++;
      this.skipComments();
    } else {
      this.logUnexpectedToken('$to');
      this.panicInsideTag();
      return false;
    }

    if (this.token().type === 'prop') {
      keymapArgs.alias = {
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

    if (this.token().type === '$in') {
      this.index++;
      this.skipComments();
    } else {
      this.logUnexpectedToken('$in');
      this.panicInsideTag();
      return false;
    }

    return this.tryParseVar(keymapArgs.items);
  }

  private tryParseCondition(condition: ConditionArgs): boolean {
    this.index++;

    if (this.token().type === '$not') {
      condition.invert = true;
      this.index++;
      this.skipComments();
    }

    return this.tryParseVar(condition.predicate);
  }

  private tryParseInjections(dest: InjectionArg[]): boolean {
    this.index++;

    const injection: InjectionArg = {
      value: [],
      contextKey: [],
    };

    if (!this.tryParseVar(injection.value)) {
      return false;
    }

    if (this.token().type === '$as') {
      this.index++;
      this.skipComments();
    } else {
      this.logUnexpectedToken('$as');
      this.panicInsideTag();
      return false;
    }

    if (!this.tryParseVar(injection.contextKey)) {
      return false;
    }
    dest.push(injection);
    return true;
  }

  private tryParseStringAttr(dest: StrAttr[]): boolean {
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

    const strValue: InterStr = [];

    res = this.tryParseStringLiteral(strValue) && res;

    if (res) dest.push({ attr, pos, strValue });
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
      return false;
    }

    this.index++;
    this.skipComments();

    switch (this.token().type) {
      case '"':
        const strValue: InterStr = [];
        res = this.tryParseStringLiteral(strValue) && res;
        if (res) dest.push({ prop, isSpread: false, pos, strValue });
        return res;
      case '{':
        const value: Var = [];
        res = this.tryParseVar(value) && res;
        if (res) dest.push({ prop, isSpread: false, pos, value });
        return res;
      default:
        this.logUnexpectedToken();
        this.panicInsideTag();
        return false;
    }
  }

  private tryParseSpreadPropAttr(dest: PropAttr[]): boolean {
    let res = true;

    const prop = '*';
    const pos = this.token().pos;

    this.index++;
    this.skipComments();

    if (this.token().type !== '=') {
      this.logUnexpectedToken('=');
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
    return this.tokens[this.index];
  }
}

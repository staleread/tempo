import { Logger } from '../../log/logger';
import { Token, TokenType } from '../lexer/lexer.types';
import {
  AstNode,
  AstNodeType,
  EventAttr,
  InterStr,
  PropAttr,
  StrAttr,
  StrPtr,
  Var,
  VdomEventType,
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
        res = this.tryParseBasicTag(dest, false) && res;
        break;
      case 'comp':
        res = this.tryParseCompTag(dest, false) && res;
        break;
      case '$for':
        res = this.tryParseForTag(dest) && res;
        break;
      case '$if':
        res = this.tryParseIfTag(dest) && res;
        break;
      case '$tag':
        res = this.tryParseGenTag(dest, false) && res;
        break;
      case '$cmp':
        res = this.tryParseGenCompTag(dest, false) && res;
        break;
      case '$inject':
        res = this.tryParseInjectTag(dest) && res;
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

  private tryParseBasicTag(dest: AstNode[], demandKey: boolean): boolean {
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
      key: undefined,
      tagArgs: {
        attrs: [],
        events: [],
      },
      children: [],
    };

    let keyDemandSatisfied = !demandKey;

    while (!'eof/>'.includes(this.token().type)) {
      switch (this.token().type) {
        case 'id':
          res = this.tryParseStringAttr(node.tagArgs!.attrs) && res;
          continue;
        case 'event':
          res =
            this.tryParseEventAttr(node.id!.str, node.tagArgs!.events) &&
            res;
          continue;
        case 'prop':
          res = false;
          this.logger.error(
            this.token().pos,
            'Property is not allowed here',
          );
          this.panicInsideTag();
          continue;
        case 'spread':
          res = false;
          this.logger.error(
            this.token().pos,
            'Spread property is not allowed here',
          );
          this.panicInsideTag();
          continue;
        case '$key':
          if (keyDemandSatisfied) {
            res = false;
            this.logger.error(
              this.token().pos,
              'Key attr is redundant or already satisfied',
            );
            this.panicInsideTag();
            continue;
          }
          this.index++;
          if (this.token().type !== '=') {
            res = false;
            this.logUnexpectedToken('=');
            this.panicInsideTag();
            continue;
          }
          this.index++;
          node.key = [];
          res = this.tryParseVar(node.key!) && res;
          keyDemandSatisfied = true;
          continue;
        case 'comment':
          this.index++;
          continue;
        default:
          res = false;
          this.logUnexpectedToken();
          this.panicInsideTag();
          continue;
      }
    }

    if (!keyDemandSatisfied) {
      res = false;
      this.logger.error(
        node.id!.pos,
        'The tag inside $for must have key property',
      );
    }

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
      if (res) dest.push(node);
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

    switch (this.token().type) {
      case 'id':
        break;
      case 'comp':
      case '$for':
      case '$if':
      case '$tag':
      case '$cmp':
      case '$inject':
      case '$children':
        this.logger.error(
          this.token().pos,
          `Expected basic tag closing, got ${this.token().type}`,
        );
        break;
      default:
        this.logUnexpectedToken();
        this.panicJumpOver('>');
        return false;
    }

    if (this.token().literal !== node.id!.str) {
      res = false;
      this.logger.error(
        this.token().pos,
        'Opening and closing tags do not match',
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

    if (res) dest.push(node);
    return res;
  }

  private tryParseCompTag(dest: AstNode[], demandKey: boolean): boolean {
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
      key: undefined,
      props: [],
      children: [],
    };

    let keyDemandSatisfied = !demandKey;

    while (!'eof/>'.includes(this.token().type)) {
      switch (this.token().type) {
        case 'id':
          res = false;
          this.logger.error(
            this.token().pos,
            'String attribute is not allowed here',
          );
          this.panicInsideTag();
          continue;
        case 'event':
          res = false;
          this.logger.error(
            this.token().pos,
            'Event attribute is not allowed here',
          );
          this.panicInsideTag();
          continue;
        case 'prop':
          res = this.tryParsePropAttr(node.props!) && res;
          continue;
        case 'spread':
          res = this.tryParseSpreadPropAttr(node.props!) && res;
          continue;
        case '$key':
          if (keyDemandSatisfied) {
            res = false;
            this.logger.error(
              this.token().pos,
              'Key attr is redundant or already satisfied',
            );
            this.panicInsideTag();
            continue;
          }
          this.index++;
          if (this.token().type !== '=') {
            res = false;
            this.logUnexpectedToken('=');
            this.panicInsideTag();
            continue;
          }
          this.index++;
          node.key = [];
          res = this.tryParseVar(node.key!) && res;
          keyDemandSatisfied = true;
          continue;
        case 'comment':
          this.index++;
          continue;
        default:
          res = false;
          this.logUnexpectedToken();
          this.panicInsideTag();
          continue;
      }
    }

    if (!keyDemandSatisfied) {
      res = false;
      this.logger.error(
        node.id!.pos,
        'The component inside $for must have key property',
      );
    }

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
      if (res) dest.push(node);
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

    switch (this.token().type) {
      case 'comp':
        break;
      case 'id':
      case '$for':
      case '$if':
      case '$tag':
      case '$cmp':
      case '$inject':
      case '$children':
        this.logger.error(
          this.token().pos,
          `Expected component closing tag, got ${this.token().type}`,
        );
        break;
      default:
        this.logUnexpectedToken();
        this.panicJumpOver('>');
        return false;
    }

    if (this.token().literal !== node.id!.str) {
      res = false;
      this.logger.error(
        this.token().pos,
        'Opening and closing component tags do not match',
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

    if (res) dest.push(node);
    return res;
  }

  private tryParseForTag(dest: AstNode[]): boolean {
    let res = true;

    const id = {
      pos: this.token().pos,
      str: this.token().type,
    };
    this.index++;
    this.skipComments();

    const node: AstNode = {
      type: 'Fr',
      id,
      loop: undefined,
      children: [],
    };

    let alias: StrPtr;

    if (this.token().type === 'prop') {
      alias = {
        pos: this.token().pos,
        str: this.token().literal!,
      };
      this.index++;
      this.skipComments();
    } else {
      res = false;
      this.logUnexpectedToken('prop');
      this.panicInsideTag();
    }

    if (res && this.token().type === '$of') {
      this.index++;
      this.skipComments();
    } else {
      res = false;
      this.logUnexpectedToken('$of');
      this.panicInsideTag();
    }

    const items: Var = [];

    if (res) {
      res = this.tryParseVar(items) && res;
    }
    if (this.token().type === '/') {
      res = false;
      this.logUnexpectedToken('>');
      this.panicJumpOver('>');
      return false;
    }
    if (this.token().type !== '>') {
      res = false;
      this.logUnexpectedToken('>');
      this.panicJumpTo('>');
    }
    this.index++;

    while (!'eof/'.includes(this.token().type)) {
      res = this.tryParseChildNode(node.children!) && res;
    }

    const tagChildren = node.children!.filter(
      (c: AstNode) => c.type !== 'Tx',
    );

    if (tagChildren.length < 1) {
      res = false;
      this.logger.error(
        node.id!.pos,
        'For tag must have one child tag, got 0',
      );
    } else if (tagChildren.length > 1) {
      res = false;
      this.logger.error(
        tagChildren[1].id!.pos,
        `For loop tag must have only one child tag, got ${tagChildren.length}`,
      );
    } else {
      const tag = tagChildren[0];
      const ALLOWED_TYPES: AstNodeType[] = ['Bt', 'Gt', 'Cp', 'Gc'];

      if (!ALLOWED_TYPES.includes(tag.type)) {
        res = false;
        this.logger.error(
          tag.id!.pos,
          'For loop tag only supports tag-like and component-like tags',
        );
      } else {
        node.children = [tag];
      }
    }

    if (this.token().type === 'eof') {
      this.logger.error(node.id!.pos, 'The tag is never closed');
      return false;
    }
    this.index++;
    this.skipComments();

    switch (this.token().type) {
      case '$for':
        break;
      case 'id':
      case 'comp':
      case '$if':
      case '$tag':
      case '$cmp':
      case '$inject':
      case '$children':
        this.logger.error(
          this.token().pos,
          `Expected $for closing tag, got ${this.token().type}`,
        );
        break;
      default:
        this.logUnexpectedToken();
        this.panicJumpOver('>');
        return false;
    }
    this.index++;
    this.skipComments();

    if (this.token().type !== '>') {
      this.logUnexpectedToken('>');
      this.panicJumpOver('>');
      return false;
    }
    this.index++;

    if (res) {
      node.loop = { alias: alias!, items };
      dest.push(node);
    }
    return res;
  }

  private tryParseIfTag(dest: AstNode[]): boolean {
    let res = true;

    const id = {
      pos: this.token().pos,
      str: this.token().type,
    };
    this.index++;
    this.skipComments();

    const node: AstNode = {
      type: 'If',
      id,
      condition: {
        invert: false,
        predicate: [],
      },
      children: [],
    };

    if (this.token().type === '$not') {
      node.condition!.invert = true;
      this.index++;
      this.skipComments();
    }

    res = this.tryParseVar(node.condition!.predicate) && res;

    if (this.token().type !== '>') {
      res = false;
      this.logUnexpectedToken('>');
      this.panicJumpTo('>');
    }
    this.index++;

    while (!'eof/'.includes(this.token().type)) {
      res = this.tryParseChildNode(node.children!) && res;
    }

    const tagChildren = node.children!.filter(
      (c: AstNode) => c.type !== 'Tx',
    );

    if (tagChildren.length < 1) {
      res = false;
      this.logger.error(
        node.id!.pos,
        'If tag must have one child tag, got 0',
      );
    } else if (tagChildren.length > 1) {
      res = false;
      this.logger.error(
        tagChildren[1].id!.pos,
        `If tag must have only one child tag, got ${tagChildren.length}`,
      );
    } else {
      const tag = tagChildren[0];
      const ALLOWED_TYPES: AstNodeType[] = ['Bt', 'Gt', 'Cp', 'Gc'];

      if (!ALLOWED_TYPES.includes(tag.type)) {
        res = false;
        this.logger.error(
          tag.id!.pos,
          'If tag only supports tag-like and component-like tags',
        );
      } else {
        node.children = [tag];
      }
    }

    if (this.token().type === 'eof') {
      this.logger.error(node.id!.pos, 'The tag is never closed');
      return false;
    }
    this.index++;
    this.skipComments();

    switch (this.token().type) {
      case '$if':
        break;
      case 'id':
      case 'comp':
      case '$for':
      case '$tag':
      case '$cmp':
      case '$inject':
      case '$children':
        this.logger.error(
          this.token().pos,
          `Expected $if closing tag, got ${this.token().type}`,
        );
        break;
      default:
        this.logUnexpectedToken();
        this.panicJumpOver('>');
        return false;
    }
    this.index++;
    this.skipComments();

    if (this.token().type !== '>') {
      this.logUnexpectedToken('>');
      this.panicJumpOver('>');
      return false;
    }
    this.index++;

    if (res) dest.push(node);
    return res;
  }

  private tryParseGenTag(dest: AstNode[], demandKey: boolean): boolean {
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
      key: undefined,
      tagName: [],
      tagArgs: {
        attrs: [],
        events: [],
      },
      children: [],
    };

    res = this.tryParseVar(node.tagName!) && res;

    let keyDemandSatisfied = !demandKey;

    if (this.token().type === '$with') {
      this.index++;
      this.skipComments();

      while (!'eof/>'.includes(this.token().type)) {
        switch (this.token().type) {
          case 'id':
            res = this.tryParseStringAttr(node.tagArgs!.attrs) && res;
            continue;
          case 'event':
            res =
              this.tryParseEventAttr(node.id!.str, node.tagArgs!.events) &&
              res;
            continue;
          case 'prop':
            res = false;
            this.logger.error(
              this.token().pos,
              'Property is not allowed here',
            );
            this.panicInsideTag();
            continue;
          case 'spread':
            res = false;
            this.logger.error(
              this.token().pos,
              'Spread property is not allowed here',
            );
            this.panicInsideTag();
            continue;
          case '$key':
            if (keyDemandSatisfied) {
              res = false;
              this.logger.error(
                this.token().pos,
                'Key attr is redundant or already satisfied',
              );
              this.panicInsideTag();
              continue;
            }
            this.index++;
            if (this.token().type !== '=') {
              res = false;
              this.logUnexpectedToken('=');
              this.panicInsideTag();
              continue;
            }
            this.index++;
            node.key = [];
            res = this.tryParseVar(node.key!) && res;
            keyDemandSatisfied = true;
            continue;
          case 'comment':
            this.index++;
            continue;
          default:
            res = false;
            this.logUnexpectedToken();
            this.panicInsideTag();
            continue;
        }
      }
    }
    if (this.token().type === '/') {
      this.index++;
      this.skipComments();

      if (this.token().type !== '>') {
        res = false;
        this.logUnexpectedToken('>');
        this.panicJumpTo('>');
      }
      this.index++;
      return res;
    } else if (this.token().type !== '>') {
      res = false;
      this.logger.error(
        this.token().pos,
        `Expected a generic tag end, got ${this.token().type}.\n` +
          'To pass attributes use $with token before',
      );
      this.panicJumpTo('>');
    }
    this.index++;

    if (!keyDemandSatisfied) {
      res = false;
      this.logger.error(
        node.id!.pos,
        'The tag inside $for must have key property',
      );
    }

    if (this.token().type === 'eof') {
      this.logUnexpectedToken();
      return false;
    }

    while (!'eof/'.includes(this.token().type)) {
      res = this.tryParseChildNode(node.children!) && res;
    }
    if (this.token().type === 'eof') {
      this.logger.error(node.id!.pos, 'The tag is never closed');
      return false;
    }
    this.index++;
    this.skipComments();

    switch (this.token().type) {
      case '$tag':
        break;
      case 'id':
      case 'comp':
      case '$for':
      case '$if':
      case '$cmp':
      case '$inject':
      case '$children':
        this.logger.error(
          this.token().pos,
          `Expected generic tag closing, got ${this.token().type}`,
        );
        break;
      default:
        this.logUnexpectedToken();
        this.panicJumpOver('>');
        return false;
    }
    this.index++;
    this.skipComments();

    if (this.token().type !== '>') {
      this.logUnexpectedToken('>');
      this.panicJumpOver('>');
      return false;
    }
    this.index++;

    if (res) dest.push(node);
    return res;
  }

  private tryParseGenCompTag(dest: AstNode[], demandKey: boolean): boolean {
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
      key: undefined,
      compFunc: [],
      props: [],
      children: [],
    };

    res = this.tryParseVar(node.compFunc!) && res;

    let keyDemandSatisfied = !demandKey;

    if (this.token().type === '$with') {
      this.index++;
      this.skipComments();

      while (!'eof/>'.includes(this.token().type)) {
        switch (this.token().type) {
          case 'id':
            res = false;
            this.logger.error(
              this.token().pos,
              'String attribute is not allowed here',
            );
            this.panicInsideTag();
            continue;
          case 'event':
            res = false;
            this.logger.error(
              this.token().pos,
              'Event attribute is not allowed here',
            );
            this.panicInsideTag();
            continue;
          case 'prop':
            res = this.tryParsePropAttr(node.props!) && res;
            continue;
          case 'spread':
            res = this.tryParseSpreadPropAttr(node.props!) && res;
            continue;
          case '$key':
            if (keyDemandSatisfied) {
              res = false;
              this.logger.error(
                this.token().pos,
                'Key attr is redundant or already satisfied',
              );
              this.panicInsideTag();
              continue;
            }
            this.index++;
            if (this.token().type !== '=') {
              res = false;
              this.logUnexpectedToken('=');
              this.panicInsideTag();
              continue;
            }
            this.index++;
            node.key = [];
            res = this.tryParseVar(node.key!) && res;
            keyDemandSatisfied = true;
            continue;
          case 'comment':
            this.index++;
            continue;
          default:
            res = false;
            this.logUnexpectedToken();
            this.panicInsideTag();
            continue;
        }
      }
    }
    if (this.token().type === '/') {
      this.index++;
      this.skipComments();

      if (this.token().type !== '>') {
        res = false;
        this.logUnexpectedToken('>');
        this.panicJumpTo('>');
      }
      this.index++;
      return res;
    } else if (this.token().type !== '>') {
      res = false;
      this.logger.error(
        this.token().pos,
        `Expected a generic component end, got ${this.token().type}.\n` +
          'To pass attributes use $with token before',
      );
      this.panicJumpTo('>');
    }
    this.index++;

    if (!keyDemandSatisfied) {
      res = false;
      this.logger.error(
        node.id!.pos,
        'The tag inside $for must have key property',
      );
    }

    if (this.token().type === 'eof') {
      this.logUnexpectedToken();
      return false;
    }

    while (!'eof/'.includes(this.token().type)) {
      res = this.tryParseChildNode(node.children!) && res;
    }
    if (this.token().type === 'eof') {
      this.logger.error(node.id!.pos, 'The tag is never closed');
      return false;
    }
    this.index++;
    this.skipComments();

    switch (this.token().type) {
      case '$cmp':
        break;
      case 'id':
      case 'comp':
      case '$for':
      case '$if':
      case '$tag':
      case '$inject':
      case '$children':
        this.logger.error(
          this.token().pos,
          `Expected generic tag closing, got ${this.token().type}`,
        );
        break;
      default:
        this.logUnexpectedToken();
        this.panicJumpOver('>');
        return false;
    }
    this.index++;
    this.skipComments();

    if (this.token().type !== '>') {
      this.logUnexpectedToken('>');
      this.panicJumpOver('>');
      return false;
    }
    this.index++;

    if (res) dest.push(node);
    return res;
  }

  private tryParseInjectTag(dest: AstNode[]): boolean {
    let res = true;

    const id = {
      pos: this.token().pos,
      str: this.token().type,
    };
    this.index++;
    this.skipComments();

    const node: AstNode = {
      type: 'Ij',
      id,
      injection: {
        value: [],
        ctx: [],
      },
      children: [],
    };

    res = this.tryParseVar(node.injection!.value) && res;

    if (res && this.token().type === '$as') {
      this.index++;
      this.skipComments();
    } else {
      res = false;
      this.logUnexpectedToken('$as');
      this.panicInsideTag();
    }

    if (res) {
      res = this.tryParseVar(node.injection!.ctx) && res;
    }

    if (this.token().type !== '>') {
      res = false;
      this.logUnexpectedToken('>');
      this.panicJumpTo('>');
    }
    this.index++;

    while (!'eof/'.includes(this.token().type)) {
      res = this.tryParseChildNode(node.children!) && res;
    }

    const tagChildren = node.children!.filter(
      (c: AstNode) => c.type !== 'Tx',
    );

    if (tagChildren!.length < 1) {
      res = false;
      this.logger.error(
        node.id!.pos,
        `Inject tag must have one child tag, got 0`,
      );
    } else if (tagChildren.length > 1) {
      res = false;
      this.logger.error(
        tagChildren[1].id!.pos,
        `Inject tag must have only one child tag, got ${tagChildren.length}`,
      );
    } else {
      const tag = tagChildren[0];
      const ALLOWED_TYPES: AstNodeType[] = ['Cp', 'Gc', 'Ij'];

      if (!ALLOWED_TYPES.includes(tag.type)) {
        res = false;
        this.logger.error(
          tag.id!.pos,
          'Inject tag only supports component-like and inject tags',
        );
      } else {
        node.children = [tag];
      }
    }

    if (this.token().type === 'eof') {
      this.logger.error(node.id!.pos, 'The tag is never closed');
      return false;
    }
    this.index++;
    this.skipComments();

    switch (this.token().type) {
      case '$inject':
        break;
      case 'id':
      case 'comp':
      case '$for':
      case '$if':
      case '$tag':
      case '$cmp':
      case '$children':
        this.logger.error(
          this.token().pos,
          `Expected $inject closing tag, got ${this.token().type}`,
        );
        break;
      default:
        this.logUnexpectedToken();
        this.panicJumpOver('>');
        return false;
    }
    this.index++;
    this.skipComments();

    if (this.token().type !== '>') {
      this.logUnexpectedToken('>');
      this.panicJumpOver('>');
      return false;
    }
    this.index++;

    if (res) {
      dest.push(node);
    }
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

    if (this.token().type === '/') {
      this.index++;
      this.skipComments();

      if (this.token().type !== '>') {
        this.logUnexpectedToken('>');
        this.panicJumpOver('>');
        return false;
      }
      this.index++;
      if (res) dest.push(node);
      return res;
    }

    if (this.token().type !== '>') {
      res = false;
      this.logUnexpectedToken('>');
      this.panicJumpTo('>');
    }
    this.index++;

    const children: AstNode[] = [];

    while (!'eof/'.includes(this.token().type)) {
      res = this.tryParseChildNode(children) && res;
    }

    if (children.length > 0) {
      res = false;
      this.logger.error(node.id!.pos, 'Children tag must have no children');
    }
    if (this.token().type === 'eof') {
      this.logger.error(node.id!.pos, 'The tag is never closed');
      return false;
    }
    this.index++;
    this.skipComments();

    switch (this.token().type) {
      case '$children':
        break;
      case 'id':
      case 'comp':
      case '$for':
      case '$if':
      case '$tag':
      case '$cmp':
      case '$inject':
        this.logger.error(
          this.token().pos,
          `Expected $children closing tag, got ${this.token().type}`,
        );
        break;
      default:
        this.logUnexpectedToken();
        this.panicJumpOver('>');
        return false;
    }
    this.index++;
    this.skipComments();

    if (this.token().type !== '>') {
      this.logUnexpectedToken('>');
      this.panicJumpOver('>');
      return false;
    }
    this.index++;

    if (res) {
      dest.push(node);
    }
    return res;
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
            'The event is only supported by "input" tags',
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

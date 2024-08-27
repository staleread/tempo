import { LexerError, LexerMode, Token, TokenType } from './lexer.types';

export class Lexer {
  static EOF = 'EOF';
  static STOP_CHARS = '{}<>"';
  static LOWER_LETTERS = 'qwertyuioipasdfghjklzxcvbnm';
  static UPPER_LETTERS = 'QWERTYUIOIPASDFGHJKLZXCVBNM';
  static DIGITS = '0123456789';
  static LETTERS = Lexer.LOWER_LETTERS + Lexer.UPPER_LETTERS;
  static ALPHANUMERICS = Lexer.LETTERS + Lexer.DIGITS;

  private readonly buffer: string;
  private mode: LexerMode = 'TXT';
  private pos: number;
  private tokenPos: number;

  constructor(buffer: string, pos: number = 0) {
    this.buffer = buffer;
    this.pos = pos;
    this.tokenPos = pos;
  }

  public readToken(): Token {
    switch (this.mode) {
      case 'TXT':
        return this.readTextToken();
      case 'TAG':
        return this.readTagToken();
      case 'VAR':
        return this.readVarToken();
      case 'TXT_VAR':
        return this.readTextVarToken();
    }
  }

  private readTextToken(): Token {
    this.syncTokenStart();
    this.skipUntilRange(Lexer.STOP_CHARS);

    if (this.tokenPos < this.pos) {
      const text = this.buffer.substring(this.tokenPos, this.pos);
      return this.createToken('STR', text);
    }

    switch (this.readChar()) {
      case '{':
        this.mode = 'TXT_VAR';
        return this.createToken('L_CURL');
      case '"':
        this.mode = 'TAG';
        return this.createToken('QUOTE');
      case '<':
        this.mode = 'TAG';
        return this.createToken('L_ARROW');
      case Lexer.EOF:
        return this.createToken('EOF');
      default:
        return this.createIllegalToken('ILLEGAL_CHAR_IN_TXT_EXPR');
    }
  }

  private readVarToken(): Token {
    this.skipSpaces();
    this.syncTokenStart();

    const char = this.readChar();
    switch (char) {
      case '.':
        return this.createToken('DOT');
      case '}':
        this.mode = 'TAG';
        return this.createToken('R_CURL');
      case Lexer.EOF:
        return this.createToken('EOF');
      default:
        if (Lexer.LETTERS.includes(char)) {
          this.pos--;
          return this.readIdTokenName();
        }
        return this.createIllegalToken('ILLEGAL_CHAR_IN_VAR_EXPR');
    }
  }

  private readTextVarToken(): Token {
    this.skipSpaces();
    this.syncTokenStart();

    const char = this.readChar();
    switch (char) {
      case '.':
        return this.createToken('DOT');
      case '}':
        this.mode = 'TXT';
        return this.createToken('R_CURL');
      case Lexer.EOF:
        return this.createToken('EOF');
      default:
        if (Lexer.LETTERS.includes(char)) {
          this.pos--;
          return this.readIdTokenName();
        }
        return this.createIllegalToken('ILLEGAL_CHAR_IN_TXT_VAR_EXPR');
    }
  }

  private readTagToken(): Token {
    this.syncTokenStart();
    this.skipSpaces();

    var char = this.readChar();

    switch (char) {
      case '{':
        this.mode = 'VAR';
        return this.createToken('L_CURL');
      case '"':
        this.mode = 'TXT';
        return this.createToken('QUOTE');
      case '>':
        this.mode = 'TXT';
        return this.createToken('R_ARROW');
      case '=':
        return this.createToken('EQUAL');
      case '/':
        return this.createToken('SLASH');
      case '!':
        return this.readCommentToken();
      case '.':
        return this.readPropToken();
      case '@':
        return this.readEventTokenName();
      case '$':
        return this.readKeywordTokenName();
      case Lexer.EOF:
        return this.createToken('EOF');
    }

    if (Lexer.UPPER_LETTERS.includes(char)) {
      return this.readComponentTokenName();
    }
    if (Lexer.LOWER_LETTERS.includes(char)) {
      return this.readIdTokenName();
    }
    return this.createIllegalToken('ILLEGAL_CHAR_IN_TAG_EXPR');
  }

  private readCommentToken(): Token {
    this.syncTokenStart();
    this.skipRange('-');

    if (this.pos - this.tokenPos !== 2) {
      return this.createIllegalToken('ILLEGAL_COMMENT_START');
    }
    this.skipUntilRange('-');

    while (![Lexer.EOF, '-'].includes(this.nextChar())) {
      this.pos++;
      this.skipUntilRange('-');
    }

    if (this.readChar() === Lexer.EOF) {
      return this.createIllegalToken('UNCLOSED_COMMENT');
    }

    const comment = this.buffer.substring(this.tokenPos + 2, this.pos - 2);
    return this.createToken('COMMENT', comment);
  }

  private readComponentTokenName(): Token {
    this.skipRange(Lexer.LETTERS);

    const name = this.buffer.substring(this.tokenPos, this.pos);
    return this.createToken('COMPONENT', name);
  }

  private readPropToken(): Token {
    this.syncTokenStart();
    this.skipRange(Lexer.LETTERS);

    const prop = this.buffer.substring(this.tokenPos, this.pos);
    return this.createToken('PROP', prop);
  }

  private readEventTokenName(): Token {
    this.syncTokenStart();

    if (!Lexer.LOWER_LETTERS.includes(this.readChar())) {
      return this.createIllegalToken('EVENT_MUST_START_WITH_LOWER_LETTER');
    }
    this.skipRange(Lexer.LOWER_LETTERS);

    const name = this.buffer.substring(this.tokenPos, this.pos);
    return this.createToken('EVENT', name);
  }

  private readKeywordTokenName(): Token {
    this.syncTokenStart();

    if (!Lexer.LOWER_LETTERS.includes(this.readChar())) {
      return this.createIllegalToken('KEY_MUST_START_WITH_LOWER_LETTER');
    }
    this.skipRange(Lexer.LOWER_LETTERS);

    const keyword = this.buffer.substring(this.tokenPos, this.pos);

    switch (keyword) {
      case 'map':
        return this.createToken('MAP');
      case 'if':
        return this.createToken('IF');
      case 'as':
        return this.createToken('AS');
      case 'not':
        return this.createToken('NOT');
      case 'child':
        return this.createToken('CHILD');
      default:
        return this.createIllegalToken('UNKNOWN_KEYWORD');
    }
  }

  private readIdTokenName(): Token {
    this.skipRange(Lexer.ALPHANUMERICS);

    while (this.peekChar() === '-') {
      if (!Lexer.ALPHANUMERICS.includes(this.nextChar())) {
        return this.createIllegalToken('ILLEGAL_CHAR_IN_ID');
      }
      this.skipRange(Lexer.ALPHANUMERICS);
    }

    const name = this.buffer.substring(this.tokenPos, this.pos);
    return this.createToken('ID', name);
  }

  private syncTokenStart() {
    this.tokenPos = this.pos;
  }

  private createToken(type: TokenType, literal?: string): Token {
    const token: Token = { type, pos: this.tokenPos, literal };
    return token;
  }

  private createIllegalToken(error: LexerError): Token {
    const token: Token = {
      type: 'ILLEGAL',
      pos: this.tokenPos,
      literal: undefined,
      error: error,
    };
    return token;
  }

  private peekChar(): string {
    if (this.pos >= this.buffer.length) {
      return Lexer.EOF;
    }
    return this.buffer[this.pos];
  }

  private readChar(): string {
    if (this.pos >= this.buffer.length) {
      return Lexer.EOF;
    }
    return this.buffer[this.pos++];
  }

  private nextChar(): string {
    if (this.pos >= this.buffer.length) {
      return Lexer.EOF;
    }
    return this.buffer[++this.pos];
  }

  private skipRange(range: string): void {
    while (
      this.pos < this.buffer.length &&
      range.includes(this.buffer[this.pos])
    ) {
      this.pos++;
    }
  }

  private skipUntilRange(range: string): void {
    while (
      this.pos < this.buffer.length &&
      !range.includes(this.buffer[this.pos])
    ) {
      this.pos++;
    }
  }

  private skipSpaces(): void {
    while (/\s/.test(this.buffer[this.pos])) {
      this.pos++;
    }
  }
}

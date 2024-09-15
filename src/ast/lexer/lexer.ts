import { LexerMode, Token, TokenType } from './lexer.types';

export class Lexer {
  static EOF = 'EOF';
  static STOP_CHARS = '{}<>"';
  static LOWER_LETTERS = 'qwertyuioipasdfghjklzxcvbnm';
  static UPPER_LETTERS = 'QWERTYUIOIPASDFGHJKLZXCVBNM';
  static DIGITS = '0123456789';
  static LETTERS = Lexer.LOWER_LETTERS + Lexer.UPPER_LETTERS;
  static ALPHANUMERICS = Lexer.LETTERS + Lexer.DIGITS;

  private mode: LexerMode = 'TXT';
  private pos = 0;
  private tokenStart = 0;

  constructor(private readonly buffer: string) {}

  public readTokens(): Token[] {
    const tokens: Token[] = [];
    let token: Token;

    do {
      token = this.readToken();
      tokens.push(token);
    } while (token.type !== 'eof');

    return tokens;
  }

  private readToken(): Token {
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
    this.tokenStart = this.pos;
    this.skipUntilRange(Lexer.STOP_CHARS);

    if (this.tokenStart < this.pos) {
      const text = this.buffer.substring(this.tokenStart, this.pos);
      return this.createToken('str', text);
    }

    switch (this.readChar()) {
      case '{':
        this.mode = 'TXT_VAR';
        return this.createToken('{');
      case '"':
        this.mode = 'TAG';
        return this.createToken('"');
      case '<':
        this.mode = 'TAG';
        return this.createToken('<');
      case Lexer.EOF:
        return this.createToken('eof');
      default:
        return this.createIllegalToken('Illegal char in txt expression');
    }
  }

  private readVarToken(): Token {
    this.skipSpaces();
    this.tokenStart = this.pos;

    const char = this.readChar();
    switch (char) {
      case '.':
        return this.createToken('dot');
      case '}':
        this.mode = 'TAG';
        return this.createToken('}');
      case Lexer.EOF:
        return this.createToken('eof');
    }
    if (Lexer.LOWER_LETTERS.includes(char)) {
      return this.readVarIdToken();
    }
    return this.createIllegalToken('Illegal char in var expression');
  }

  private readTextVarToken(): Token {
    this.skipSpaces();
    this.tokenStart = this.pos;

    const char = this.readChar();
    switch (char) {
      case '.':
        return this.createToken('dot');
      case '}':
        this.mode = 'TXT';
        return this.createToken('}');
      case Lexer.EOF:
        return this.createToken('eof');
    }
    if (Lexer.LOWER_LETTERS.includes(char)) {
      return this.readVarIdToken();
    }
    return this.createIllegalToken('Illegal char in txt-var expression');
  }

  private readTagToken(): Token {
    this.skipSpaces();
    this.tokenStart = this.pos;

    const char = this.readChar();

    switch (char) {
      case '{':
        this.mode = 'VAR';
        return this.createToken('{');
      case '"':
        this.mode = 'TXT';
        return this.createToken('"');
      case '>':
        this.mode = 'TXT';
        return this.createToken('>');
      case '=':
        return this.createToken('=');
      case '*':
        return this.createToken('spread');
      case '/':
        return this.createToken('/');
      case '!':
        return this.readCommentToken();
      case '.':
        return this.readPropToken();
      case '@':
        return this.readEventTokenName();
      case '$':
        return this.readKeywordTokenName();
      case Lexer.EOF:
        return this.createToken('eof');
    }

    if (Lexer.UPPER_LETTERS.includes(char)) {
      return this.readComponentTokenName();
    }
    if (Lexer.LOWER_LETTERS.includes(char)) {
      return this.readIdToken();
    }
    return this.createIllegalToken('Illegal char in tag expression');
  }

  private readCommentToken(): Token {
    this.tokenStart = this.pos;
    this.skipRange('-');

    if (this.pos - this.tokenStart !== 2) {
      return this.createIllegalToken('Illegal comment start');
    }
    this.skipUntilRange('-');

    while (![Lexer.EOF, '-'].includes(this.nextChar())) {
      this.pos++;
      this.skipUntilRange('-');
    }

    if (this.readChar() === Lexer.EOF) {
      return this.createIllegalToken('Comment is not closed');
    }

    const comment = this.buffer.substring(
      this.tokenStart + 2,
      this.pos - 2,
    );
    return this.createToken('comment', comment);
  }

  private readComponentTokenName(): Token {
    this.skipRange(Lexer.LETTERS);

    const name = this.buffer.substring(this.tokenStart, this.pos);
    return this.createToken('comp', name);
  }

  private readPropToken(): Token {
    this.tokenStart = this.pos;

    if (!Lexer.LOWER_LETTERS.includes(this.readChar())) {
      return this.createIllegalToken(
        'Prop must start with lowercase letter',
      );
    }
    this.skipRange(Lexer.LETTERS);

    const prop = this.buffer.substring(this.tokenStart, this.pos);
    return this.createToken('prop', prop);
  }

  private readEventTokenName(): Token {
    this.tokenStart = this.pos;

    if (!Lexer.LOWER_LETTERS.includes(this.readChar())) {
      return this.createIllegalToken(
        'Event must start with lowercase letter',
      );
    }
    this.skipRange(Lexer.LOWER_LETTERS);

    const name = this.buffer.substring(this.tokenStart, this.pos);
    return this.createToken('event', name);
  }

  private readKeywordTokenName(): Token {
    this.tokenStart = this.pos;

    if (!Lexer.LOWER_LETTERS.includes(this.readChar())) {
      return this.createIllegalToken(
        'Keyword must start with lowercase letter',
      );
    }
    this.skipRange(Lexer.LOWER_LETTERS);

    const keyword = this.buffer.substring(this.tokenStart, this.pos);

    switch (keyword) {
      case 'yes':
        return this.createToken('$yes');
      case 'no':
        return this.createToken('$no');
      case 'ref':
        return this.createToken('$ref');
      case 'map':
        return this.createToken('$map');
      case 'to':
        return this.createToken('$to');
      case 'in':
        return this.createToken('$in');
      case 'if':
        return this.createToken('$if');
      case 'not':
        return this.createToken('$not');
      case 'tag':
        return this.createToken('$tag');
      case 'cmp':
        return this.createToken('$cmp');
      case 'use':
        return this.createToken('$use');
      case 'as':
        return this.createToken('$as');
      case 'children':
        return this.createToken('$children');
      default:
        return this.createIllegalToken('Unknown keyword');
    }
  }

  private readIdToken(): Token {
    this.skipRange(Lexer.ALPHANUMERICS);

    while (this.peekChar() === '-') {
      if (!Lexer.ALPHANUMERICS.includes(this.nextChar())) {
        return this.createIllegalToken('Illegal char in id');
      }
      this.skipRange(Lexer.ALPHANUMERICS);
    }

    const name = this.buffer.substring(this.tokenStart, this.pos);
    return this.createToken('id', name);
  }

  private readVarIdToken(): Token {
    this.skipRange(Lexer.LETTERS);

    const prop = this.buffer.substring(this.tokenStart, this.pos);
    return this.createToken('vid', prop);
  }

  private createToken(type: TokenType, literal?: string): Token {
    const token: Token = { type, pos: this.tokenStart, literal };
    return token;
  }

  private createIllegalToken(error: string): Token {
    const token: Token = {
      type: 'ILLEGAL',
      pos: this.tokenStart,
      error,
    };
    return token;
  }

  private peekChar(): string {
    const char = this.buffer[this.pos];
    return char ? char : Lexer.EOF;
  }

  private readChar(): string {
    const char = this.buffer[this.pos++];
    return char ? char : Lexer.EOF;
  }

  private nextChar(): string {
    const char = this.buffer[++this.pos];
    return char ? char : Lexer.EOF;
  }

  private skipRange(range: string): void {
    let char: string | undefined;

    while ((char = this.buffer[this.pos]) && range.includes(char)) {
      this.pos++;
    }
  }

  private skipUntilRange(range: string): void {
    let char: string | undefined;

    while ((char = this.buffer[this.pos]) && !range.includes(char)) {
      this.pos++;
    }
  }

  private skipSpaces(): void {
    let char: string | undefined;

    while ((char = this.buffer[this.pos]) && /\s/.test(char)) {
      this.pos++;
    }
  }
}

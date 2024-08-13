import { Token, TokenTypes } from './token.types';

export class SerianillaScanner {
  private isTextMod = true;
  private carretPos = -1;

  constructor(
    private readonly text: string,
    private readonly errorContext = 'Unknown',
  ) {
    this.text = text;
    this.errorContext = errorContext;
  }

  readNextToken(): Token {
    if (this.carretPos === this.text.length - 1) return { type: 'EOF' };

    this.carretPos++;

    if (this.isTextMod) {
      var lexemeEndIndex = this.carretPos;

      while (
        !'<>'.includes(this.text[lexemeEndIndex]) &&
        lexemeEndIndex !== this.text.length - 1
      ) {
        lexemeEndIndex++;
      }

      if (lexemeEndIndex !== this.carretPos) {
        const lexeme = this.text.substring(this.carretPos, lexemeEndIndex);

        this.carretPos = lexemeEndIndex - 1;
        return {
          type: 'TEXT',
          literal: lexeme,
        };
      }
    }

    this.isTextMod = false;
    this.skipSpaces();

    switch (this.text[this.carretPos]) {
      case '=':
        return { type: 'ASSIGN' };
      case '{':
        return { type: 'ATTACH_START' };
      case '}':
        return { type: 'ATTACH_END' };
      case '.':
        return { type: 'DOT' };
      case '>':
        this.isTextMod = true;
        return { type: 'TAG_END' };
      case '#':
        this.carretPos++;
        return this.readComponentToken();
      case '$':
        this.carretPos++;
        return this.readKeywordToken();
      case '@':
        this.carretPos++;
        return this.readEventToken();
      case '"':
        this.carretPos++;
        return this.readStringToken();
      case '<':
        this.carretPos++;
        return this.readTagStart();
      case '/':
        this.carretPos++;
        return this.readOpeningTagEndToken();
      default:
        return this.readIdentifierToken();
    }
  }

  private readComponentToken(): Token {
    const LETTER = /[a-zA-Z]/;

    if (!LETTER.test(this.text[this.carretPos]))
      this.throw(
        `Failed to parse component token at char ${this.carretPos}`,
      );

    var lexemeEndIndex = this.carretPos + 1;

    while (
      lexemeEndIndex !== this.text.length - 1 &&
      LETTER.test(this.text[lexemeEndIndex])
    ) {
      lexemeEndIndex++;
    }

    const lexeme = this.text.substring(this.carretPos, lexemeEndIndex);
    this.carretPos = lexemeEndIndex - 1;

    return {
      type: 'COMPONENT',
      literal: lexeme,
    };
  }

  private readKeywordToken(): Token {
    const LETTER = /[a-z]/;

    if (!LETTER.test(this.text[this.carretPos]))
      this.throw(`Failed to parse keyword token at char ${this.carretPos}`);

    var lexemeEndIndex = this.carretPos + 1;

    while (
      lexemeEndIndex !== this.text.length - 1 &&
      LETTER.test(this.text[lexemeEndIndex])
    ) {
      lexemeEndIndex++;
    }

    const lexeme = this.text.substring(this.carretPos, lexemeEndIndex);
    this.carretPos = lexemeEndIndex - 1;

    return {
      type: 'KEYWORD',
      literal: lexeme,
    };
  }

  private readEventToken(): Token {
    const LETTER = /[a-z]/;

    if (!LETTER.test(this.text[this.carretPos]))
      this.throw(`Failed to parse event token at char ${this.carretPos}`);

    var lexemeEndIndex = this.carretPos + 1;

    while (
      lexemeEndIndex !== this.text.length - 1 &&
      LETTER.test(this.text[lexemeEndIndex])
    ) {
      lexemeEndIndex++;
    }

    const lexeme = this.text.substring(this.carretPos, lexemeEndIndex);
    this.carretPos = lexemeEndIndex - 1;

    return {
      type: 'EVENT',
      literal: lexeme,
    };
  }

  private readStringToken(): Token {
    var lexemeEndIndex = this.carretPos + 1;

    while (
      lexemeEndIndex !== this.text.length - 1 &&
      !'"\n\r'.includes(this.text[lexemeEndIndex])
    ) {
      lexemeEndIndex++;
    }

    if (this.text[lexemeEndIndex] !== '"') {
      const message =
        'Unexpected char found while scanning string ' +
        `token "${this.text[lexemeEndIndex]}"`;

      this.throw(message);
    }

    const lexeme = this.text.substring(this.carretPos, lexemeEndIndex);
    this.carretPos = lexemeEndIndex;

    return {
      type: 'STRING',
      literal: lexeme,
    };
  }

  private readTagStart(): Token {
    this.skipSpaces();

    if (this.text[this.carretPos] === '/')
      return { type: 'CLOSING_TAG_START' };

    this.carretPos--;
    return { type: 'OPENING_TAG_START' };
  }

  private readOpeningTagEndToken(): Token {
    this.skipSpaces();

    const char = this.text[this.carretPos];

    if (char !== '>') {
      const message =
        `Failed to parse opening tag end token ">" ` +
        `expected at char ${this.carretPos}, got "${char}"`;

      this.throw(message);
    }

    this.isTextMod = true;
    return { type: 'OPENING_TAG_END' };
  }

  private readIdentifierToken(): Token {
    const LETTER = /[a-zA-Z]/;
    const ACCEPTABLE_CHAR = /[\-a-zA-Z0-9]/;
    const VALID_WORD = /^[a-zA-z](-[a-zA-Z0-9]+)*[a-zA-Z0-9]*$/;

    if (!LETTER.test(this.text[this.carretPos]))
      this.throw(
        `Failed to parse identifier token at char ${this.carretPos}`,
      );

    var lexemeEndIndex = this.carretPos + 1;

    while (
      lexemeEndIndex !== this.text.length - 1 &&
      ACCEPTABLE_CHAR.test(this.text[lexemeEndIndex])
    ) {
      lexemeEndIndex++;
    }

    const lexeme = this.text.substring(this.carretPos, lexemeEndIndex);

    if (!VALID_WORD.test(lexeme))
      this.throw(`"${lexeme}" is not a valid identifier`);

    this.carretPos = lexemeEndIndex - 1;

    return {
      type: 'IDENTIFIER',
      literal: lexeme,
    };
  }

  private skipSpaces() {
    const SPACE = /\s/;

    while (SPACE.test(this.text[this.carretPos])) {
      this.carretPos++;
    }
  }

  private throw(message: string) {
    const textModeStatus = this.isTextMod ? 'on' : 'off';
    const errorMessage =
      `SCANNER [${this.errorContext}; ` +
      `text_mode=${textModeStatus}]: ${message}`;

    throw new Error(errorMessage);
  }
}

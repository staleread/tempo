import { ScannerLogger } from './scanner-logger';
import { Token, TokenTypes } from './token.types';

const LOWER_LETTERS = 'qwertyuioipasdfghjklzxcvbnm';
const UPPER_LETTERS = 'QWERTYUIOIPASDFGHJKLZXCVBNM';
const DIGITS = '0123456789';

const LETTERS = [...LOWER_LETTERS, ...UPPER_LETTERS];
const ALPHANUMERICS = [...LETTERS, ...DIGITS];

export class Scanner {
  private static CHARS_BEFORE_TRAP = 40;

  private readonly logger: ScannerLogger;
  private isTextMod = true;
  private carretPos = -1;

  constructor(
    private readonly text: string,
    private readonly errorContext?: string,
  ) {
    this.text = text;
    this.logger = new ScannerLogger(text, errorContext);
  }

  readNextToken(): Token {
    if (this.carretPos === this.text.length - 1) return { type: 'EOF' };

    this.carretPos++;

    if (this.isTextMod) {
      var tokenEndPos = this.carretPos;

      while (
        !'<>'.includes(this.text[tokenEndPos]) &&
        tokenEndPos !== this.text.length - 1
      ) {
        tokenEndPos++;
      }

      if (tokenEndPos !== this.carretPos) {
        const token = this.text.substring(this.carretPos, tokenEndPos);

        this.carretPos = tokenEndPos - 1;
        return {
          type: 'TEXT',
          literal: token,
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
    if (!UPPER_LETTERS.includes(this.text[this.carretPos])) {
      this.logger.error(
        this.carretPos,
        'Invalid component token. Capital letter expected',
      );
    }

    var tokenEndPos = this.carretPos + 1;

    while (
      this.canMoveCarret(tokenEndPos) &&
      LETTERS.includes(this.text[tokenEndPos])
    ) {
      tokenEndPos++;
    }

    const token = this.text.substring(this.carretPos, tokenEndPos);
    this.carretPos = tokenEndPos - 1;

    return {
      type: 'COMPONENT',
      literal: token,
    };
  }

  private readKeywordToken(): Token {
    if (!LOWER_LETTERS.includes(this.text[this.carretPos])) {
      this.logger.error(
        this.carretPos,
        'Invalid keyword. Lower case letter expected',
      );
    }

    var tokenEndPos = this.carretPos + 1;

    while (
      this.canMoveCarret(tokenEndPos) &&
      LOWER_LETTERS.includes(this.text[tokenEndPos])
    ) {
      tokenEndPos++;
    }

    const token = this.text.substring(this.carretPos, tokenEndPos);
    this.carretPos = tokenEndPos - 1;

    return {
      type: 'KEYWORD',
      literal: token,
    };
  }

  private readEventToken(): Token {
    if (!LOWER_LETTERS.includes(this.text[this.carretPos])) {
      this.logger.error(
        this.carretPos,
        'Invalid event token. Lower case letter expected',
      );
    }

    var tokenEndPos = this.carretPos + 1;

    while (
      this.canMoveCarret(tokenEndPos) &&
      LOWER_LETTERS.includes(this.text[tokenEndPos])
    ) {
      tokenEndPos++;
    }

    const token = this.text.substring(this.carretPos, tokenEndPos);
    this.carretPos = tokenEndPos - 1;

    return {
      type: 'EVENT',
      literal: token,
    };
  }

  private readStringToken(): Token {
    var tokenEndPos = this.carretPos + 1;

    while (
      this.canMoveCarret(tokenEndPos) &&
      !'"\n'.includes(this.text[tokenEndPos])
    ) {
      tokenEndPos++;
    }

    if (this.text[tokenEndPos] === '\n') {
      this.logger.error(
        tokenEndPos,
        'Invalid string token. New lines are not allowed inside strings',
      );
    }

    if (this.text[tokenEndPos] !== '"') {
      this.logger.error(
        tokenEndPos,
        'Invalid string token. Where is the closing quote?',
      );
    }

    const token = this.text.substring(this.carretPos, tokenEndPos);
    this.carretPos = tokenEndPos;

    return {
      type: 'STRING',
      literal: token,
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

    if (this.text[this.carretPos] !== '>') {
      this.logger.error(
        this.carretPos,
        'Invalid opening tag end token. "/>" expected',
      );
    }

    this.isTextMod = true;
    return { type: 'OPENING_TAG_END' };
  }

  private readIdentifierToken(): Token {
    if (!LETTERS.includes(this.text[this.carretPos])) {
      this.logger.error(
        this.carretPos,
        'Invalid identifier token. A letter expected',
      );
    }

    var tokenEndPos = this.carretPos + 1;

    while (
      this.canMoveCarret(tokenEndPos) &&
      ALPHANUMERICS.includes(this.text[tokenEndPos])
    ) {
      tokenEndPos++;
    }

    while (
      this.canMoveCarret(tokenEndPos) &&
      this.text[tokenEndPos] === '-'
    ) {
      tokenEndPos++;

      if (!ALPHANUMERICS.includes(this.text[tokenEndPos])) {
        this.logger.error(
          tokenEndPos,
          'Invalid identifier token. A letter or a digit expected',
        );
      }
      tokenEndPos++;

      while (
        this.canMoveCarret(tokenEndPos) &&
        ALPHANUMERICS.includes(this.text[tokenEndPos])
      ) {
        tokenEndPos++;
      }
    }

    const token = this.text.substring(this.carretPos, tokenEndPos);
    this.carretPos = tokenEndPos - 1;

    return {
      type: 'IDENTIFIER',
      literal: token,
    };
  }

  private skipSpaces() {
    const SPACE = /\s/;

    while (SPACE.test(this.text[this.carretPos])) {
      this.carretPos++;
    }
  }

  private canMoveCarret(pos?: number) {
    return pos === undefined
      ? this.carretPos < this.text.length - 1
      : pos < this.text.length - 1;
  }
}

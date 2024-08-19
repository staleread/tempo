import {
  Lexer,
  LexerErrorType,
  LexerState,
  LexerStateHandler,
  Token,
  TokenType,
} from './lexer.types';

const EOF = 'EOF';
const STOP_CHARS = '{}<>"';
const LOWER_LETTERS = 'qwertyuioipasdfghjklzxcvbnm';
const UPPER_LETTERS = 'QWERTYUIOIPASDFGHJKLZXCVBNM';
const DIGITS = '0123456789';

const LETTERS = LOWER_LETTERS + UPPER_LETTERS;
const ALPHANUMERICS = LETTERS + DIGITS;

function peekChar(l: Lexer): string {
  if (l.pos >= l.buffer.length) {
    return EOF;
  }
  return l.buffer[l.pos];
}

function readChar(l: Lexer): string {
  if (l.pos >= l.buffer.length) {
    return EOF;
  }
  return l.buffer[l.pos++];
}

function nextChar(l: Lexer): string {
  if (l.pos >= l.buffer.length) {
    return EOF;
  }
  return l.buffer[++l.pos];
}

function skipRange(l: Lexer, range: string): void {
  while (l.pos < l.buffer.length && range.includes(l.buffer[l.pos])) {
    l.pos++;
  }
}

function skipUntilRange(l: Lexer, range: string): void {
  while (l.pos < l.buffer.length && !range.includes(l.buffer[l.pos])) {
    l.pos++;
  }
}

function skipSpaces(l: Lexer): void {
  while (/\s/.test(l.buffer[l.pos])) {
    l.pos++;
  }
}

function readTextToken(l: Lexer): Token {
  const tmpPos = l.pos;

  skipUntilRange(l, STOP_CHARS);

  if (tmpPos < l.pos) {
    const text = l.buffer.substring(tmpPos, l.pos);
    return { type: 'STR', literal: text };
  }

  switch (readChar(l)) {
    case '{':
      l.state = 'TXT_VAR';
      return { type: 'L_CURL' };
    case '"':
      l.state = 'TAG';
      return { type: 'QUOTE' };
    case '<':
      l.state = 'TAG';
      return { type: 'L_ARROW' };
    case EOF:
      return { type: 'EOF' };
    default:
      return {
        type: 'ILLEGAL',
        literal: undefined,
        error: 'TXT_HAS_ILLEGAL_CHAR',
      };
  }
}

function readIdTokenName(l: Lexer): Token {
  const tmpPos = l.pos;

  if (!LETTERS.includes(readChar(l))) {
    return {
      type: 'ILLEGAL',
      literal: undefined,
      error: 'ID_MUST_START_WITH_LETTER',
    };
  }
  skipRange(l, ALPHANUMERICS);

  while (peekChar(l) === '-') {
    if (!ALPHANUMERICS.includes(nextChar(l))) {
      return {
        type: 'ILLEGAL',
        literal: undefined,
        error: 'ID_HAS_ILLEGAL_CHAR',
      };
    }
    skipRange(l, ALPHANUMERICS);
  }

  const name = l.buffer.substring(tmpPos, l.pos);
  return { type: 'ID', literal: name };
}

function readVarToken(l: Lexer): Token {
  skipSpaces(l);

  const char = readChar(l);

  switch (char) {
    case '.':
      return { type: 'DOT' };
    case '}':
      l.state = 'TAG';
      return { type: 'R_CURL' };
    case EOF:
      return { type: 'EOF' };
    default:
      if (LETTERS.includes(char)) {
        l.pos--;
        return readIdTokenName(l);
      }
      return {
        type: 'ILLEGAL',
        literal: undefined,
        error: 'VAR_HAS_ILLEGAL_CHAR',
      };
  }
}

function readTextVarToken(l: Lexer): Token {
  skipSpaces(l);

  const char = readChar(l);

  switch (char) {
    case '.':
      return { type: 'DOT' };
    case '}':
      l.state = 'TXT';
      return { type: 'R_CURL' };
    case EOF:
      return { type: 'EOF' };
    default:
      if (LETTERS.includes(char)) {
        l.pos--;
        return readIdTokenName(l);
      }
      return {
        type: 'ILLEGAL',
        literal: undefined,
        error: 'TXT_VAR_HAS_ILLEGAL_CHAR',
      };
  }
}

function readComponentTokenName(l: Lexer): Token {
  const tmpPos = l.pos;

  if (!UPPER_LETTERS.includes(readChar(l))) {
    return {
      type: 'ILLEGAL',
      literal: undefined,
      error: 'COMPONENT_MUST_START_WITH_CAPITAL_LETTER',
    };
  }
  skipRange(l, LETTERS);

  const name = l.buffer.substring(tmpPos, l.pos);
  return { type: 'COMPONENT', literal: name };
}

function readEventTokenName(l: Lexer): Token {
  const tmpPos = l.pos;

  if (!LOWER_LETTERS.includes(readChar(l))) {
    return {
      type: 'ILLEGAL',
      literal: undefined,
      error: 'EVENT_MUST_START_WITH_LOWER_LETTER',
    };
  }
  skipRange(l, LOWER_LETTERS);

  const name = l.buffer.substring(tmpPos, l.pos);
  return { type: 'EVENT', literal: name };
}

function readKeywordTokenName(l: Lexer): Token {
  const tmpPos = l.pos;

  if (!LOWER_LETTERS.includes(readChar(l))) {
    return {
      type: 'ILLEGAL',
      literal: undefined,
      error: 'KEY_MUST_START_WITH_LOWER_LETTER',
    };
  }
  skipRange(l, LOWER_LETTERS);

  const keyword = l.buffer.substring(tmpPos, l.pos);

  switch (keyword) {
    case 'map':
      return { type: 'MAP' };
    case 'if':
      return { type: 'IF' };
    case 'as':
      return { type: 'AS' };
    case 'not':
      return { type: 'NOT' };
    case 'child':
      return { type: 'CHILD' };
    default:
      return {
        type: 'ILLEGAL',
        literal: undefined,
        error: 'UNKNOWN_KEYWORD',
      };
  }
}

function readTagToken(l: Lexer): Token {
  skipSpaces(l);

  var char = readChar(l);
  switch (char) {
    case '{':
      l.state = 'VAR';
      return { type: 'L_CURL' };
    case '"':
      l.state = 'TXT';
      return { type: 'QUOTE' };
    case '>':
      l.state = 'TXT';
      return { type: 'R_ARROW' };
    case '=':
      return { type: 'EQUAL' };
    case '/':
      return { type: 'SLASH' };
    case '#':
      return readComponentTokenName(l);
    case '@':
      return readEventTokenName(l);
    case '$':
      return readKeywordTokenName(l);
    case EOF:
      return { type: 'EOF' };
    default:
      if (LETTERS.includes(char)) {
        l.pos--;
        return readIdTokenName(l);
      }
      return {
        type: 'ILLEGAL',
        literal: undefined,
        error: 'TAG_HAS_ILLEGAL_CHAR',
      };
  }
}

function getStateHandler(state: LexerState): LexerStateHandler {
  switch (state) {
    case 'TXT':
      return readTextToken;
    case 'TAG':
      return readTagToken;
    case 'VAR':
      return readVarToken;
    case 'TXT_VAR':
      return readTextVarToken;
  }
}

export function readToken(lexer: Lexer): Token {
  const handler = getStateHandler(lexer.state);
  return handler(lexer);
}

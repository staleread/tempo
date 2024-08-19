import { Lexer, Token } from './lexer.types';

export function printLexerError(l: Lexer, token: Token): void {
  let prevNewLinePos = 0;
  let lineNumber = 1;

  for (let i = 0; i < l.pos; i++) {
    if (l.buffer[i] === '\n') {
      prevNewLinePos = i;
      lineNumber++;
    }
  }

  const nextNewLinePos = l.buffer.indexOf('\n', l.pos);

  const errorLine =
    nextNewLinePos < 0
      ? l.buffer.substring(prevNewLinePos + 1)
      : l.buffer.substring(prevNewLinePos + 1, nextNewLinePos);

  const spacesBeforeChar = l.pos - prevNewLinePos;

  let pointer = '^';

  for (let i = 0; i < spacesBeforeChar; i++) {
    pointer = ' ' + pointer;
  }

  console.error(
    `[LEXER ERROR] in ${l.context}, line ${lineNumber}: ` +
      `${token.error}\n  ${errorLine}\n${pointer}\n`,
  );
}

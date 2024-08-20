import { Token } from './lexer.types';

interface TokenPos {
  line: number;
  column: number;
}

function getTokenPos(buffer: string, pos: number): TokenPos {
  var line = 0;
  var column = 0;

  for (let i = 0; i < pos; i++) {
    if (buffer[i] !== '\n') {
      column++;
      continue;
    }
    line++;
    column = 0;
  }
  return { line, column };
}

export function printLexerError(buffer: string, token: Token): void {
  const tokenPos = getTokenPos(buffer, token.pos);
  let prevNewLinePos = 0;

  for (let i = 0; i < token.pos; i++) {
    if (buffer[i] === '\n') {
      prevNewLinePos = i;
    }
  }

  const nextNewLinePos = buffer.indexOf('\n', token.pos);

  const errorLine =
    nextNewLinePos < 0
      ? buffer.substring(prevNewLinePos + 1)
      : buffer.substring(prevNewLinePos + 1, nextNewLinePos);

  const spacesBeforeChar = token.pos - prevNewLinePos - 1;

  let pointer = '^';

  for (let i = 0; i < spacesBeforeChar; i++) {
    pointer = ' ' + pointer;
  }

  console.error(
    `[LEXER ERROR] on line ${tokenPos.line}, char ${tokenPos.column}: ` +
      `${token.error}\n${errorLine}\n${pointer}\n`,
  );
}

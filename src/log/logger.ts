export class Logger {
  static readonly POINTER = '^';

  constructor(
    protected readonly componentName: string,
    protected readonly buffer: string,
  ) {}

  protected static getLineWithCharPointer(column: number) {
    var pointer = '^';

    for (let i = 0; i < column; i++) {
      pointer = ' ' + pointer;
    }
    return pointer;
  }

  public error(at: number, message: string): void {
    const lineNumber = this.calcCharLine(at);
    const lineWithPointer = this.getLineWithPointer(at);

    console.error(
      `${this.componentName} at line ${lineNumber}: ` +
        `${message}\n${lineWithPointer}`,
    );
  }

  protected getLineWithPointer(pos: number): string {
    const column = this.calcCharColumn(pos);
    const errorLine = this.getLineWithCharAt(pos);

    var pointer = Logger.POINTER;

    for (let i = 0; i < column; i++) {
      pointer = ' ' + pointer;
    }
    return errorLine + '\n' + pointer;
  }

  protected calcCharLine(pos: number): number {
    var line = 0;

    for (let i = 0; i < pos; i++) {
      if (this.buffer[i] === '\n') {
        line++;
      }
    }
    return line;
  }

  protected calcCharColumn(pos: number): number {
    var column = 0;

    for (let i = 0; i < pos; i++) {
      if (this.buffer[i] !== '\n') {
        column++;
        continue;
      }
      column = 0;
    }
    return column;
  }

  protected getLineWithCharAt(pos: number): string {
    let prevNewLinePos = -1;

    for (let i = 0; i < pos; i++) {
      if (this.buffer[i] === '\n') {
        prevNewLinePos = i;
      }
    }

    const nextNewLinePos = this.buffer.indexOf('\n', pos);

    return nextNewLinePos < 0
      ? this.buffer.substring(prevNewLinePos + 1)
      : this.buffer.substring(prevNewLinePos + 1, nextNewLinePos);
  }
}

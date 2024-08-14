export class ScannerLogger {
  private static LINES_TO_SHOW = 3;

  constructor(
    private readonly input: string,
    private readonly context: string = 'Unknown',
  ) {}

  error(charPos: number, message: string) {
    const errorPrint = this.getErrorPrintStart(charPos);

    throw new Error(
      `SCANNER [${this.context}]: ${message}\n\n${errorPrint}<-----\n`,
    );
  }

  private getErrorPrintStart(charPos: number): string {
    var startIndex = charPos - 1;
    var newLinesRemained = ScannerLogger.LINES_TO_SHOW;

    while (startIndex > 0 && newLinesRemained > 0) {
      if (this.input[startIndex] === '\n') {
        newLinesRemained--;
      }
      startIndex--;
    }
    return this.input.substring(startIndex + 1, charPos + 1);
  }
}

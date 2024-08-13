import { SerianillaScanner } from './scanner/scanner';
import { Token } from './scanner/token.types';

const text = `
<$map context="prod" items={prods}>
  Hello!
  <#MyTag @click={handler} />
</$map>`;

const scanner = new SerianillaScanner(text, 'Component');
var token: Token;

do {
  token = scanner.readNextToken();
  console.log(token);
} while (token.type !== 'EOF');

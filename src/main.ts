import { Scanner } from './cmp-frontend/scanner';
import { Token } from './cmp-frontend/token.types';

const text = `
<$map context="prod" items={prods}>
  Hello!
  <#MyTag @click={handler} />
</$map>`;

const scanner = new Scanner(text, 'Component');
var token: Token;

do {
  token = scanner.readNextToken();
  console.log(token);
} while (token.type !== 'EOF');

import { Logger } from './log/logger';
import { AstProvider } from './ast/ast-provider';

const text = `
<div class="main">
  <$tag {my} $with .class="cool"/>
  <Parent *={hello}>
    <div></div>
    Text
  </Parent>
</div>`;

const logger = new Logger('App', text);
const provider = new AstProvider();

console.dir(provider.getAst(text, logger), { depth: null });

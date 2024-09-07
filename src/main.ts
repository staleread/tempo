import { AstProvider } from './ast/ast-provider';
import { Logger } from './log/logger';

const template = `
<div>
  <$inject {value} $as {context}>
    <Product/>
  </$inject>
  <$tag {div} $with attr="a">Hi!</$tag>
  <$for .prod $of {products}>
    <p>{prod.name}</p>
  </$for>
  <$if $not {a}>
    <$cmp {func} $with .a={b} .c="d" *={props}>
      <a/>
      <b/>
    </$cmp>
  </$if>
</div>`;

const astProvider = new AstProvider();
const logger = new Logger('App', template);
const ast = astProvider.getAst(template, logger);

console.dir(ast, { depth: null });

import { AstProvider } from './ast/ast-provider';
import { StateAllocator } from './core/state/state-allocator';
import { LoggerFactory } from './log/logger-factory';
import { ComponentUnwrapperFactory } from './vdom/component-unwrapper-factory';
import { VdomUnwrapper } from './vdom/vdom-unwrapper';
import {
  AnyObject,
  ComponentResult,
  VdomNode,
  VdomUnwrapperContext,
} from './vdom/vdom.types';

function App(): ComponentResult {
  const imports = [Product];

  const template = `
  <div>
    <$inject {theme} $as {context}>
      <Product .name={name}>
        <a href="imachild.com">Click me!</a>
      </Product>
    </$inject>
  </div>`;

  const attach = {
    name: 'Apple',
    theme: 'Dark',
    context: 'ThemeContext',
  };

  return { imports, template, attach };
}

function Product({ name }: { name: string }): ComponentResult {
  const template = `
  <table>
    <$children/>
    <p>{name}</p>
  </table>`;

  const attach = {
    name,
  };
  return { template, attach };
}

const sa = new StateAllocator();
const ap = new AstProvider();
const lf = new LoggerFactory();
const cuf = new ComponentUnwrapperFactory(lf, ap);
const vu = new VdomUnwrapper(sa, cuf);

const root: VdomNode = {
  type: 'Root',
  children: [],
};

const ctx: VdomUnwrapperContext = {
  componentId: App.name,
  func: App,
  props: {},
  injections: [],
};

vu.unwrapComponent(root.children!, ctx, 0);

console.dir(root, { depth: null });

import { AstProvider } from './ast/ast-provider';
import { StateAllocator } from './core/state/state-allocator';
import { LoggerFactory } from './log/logger-factory';
import { ComponentUnwrapperFactory } from './vdom/component-unwrapper-factory';
import { VdomUnwrapper } from './vdom/vdom-unwrapper';
import {
  AnyObject,
  ComponentResult,
  ComponentUnwrapperDto,
  VdomNode,
} from './vdom/vdom.types';

function App(): ComponentResult {
  const imports = [Product];

  const template = `
  <div>
    <div class="contrubutors">
      <p $map {c.id} $to .c $in {contribs}/>
    </div>
    <Product .name={name} $use {theme} $as {context}>
      <a href="imachild.com">Click me!</a>
    </Product>
  </div>`;

  const attach = {
    name: 'Apple',
    theme: 'Dark',
    context: 'ThemeContext',
    contribs: [
      { id: 1, user: 'Nicolas' },
      { id: 2, user: 'Bodya' },
    ],
  };

  return { imports, template, attach };
}

function Product({
  name,
  price,
}: { name: string; price?: number }): ComponentResult {
  const template = `
  <div class="product">
    <h2>Product: {name}</h2>
    <p $if {price}>Price: {price}</p>
    <$children/>
  </div>`;

  const attach = {
    name,
    price,
  };
  return { template, attach };
}

const compFunc = App;
const sa = new StateAllocator();
const ap = new AstProvider();
const lf = new LoggerFactory();
const cuf = new ComponentUnwrapperFactory(lf, ap);
const vu = new VdomUnwrapper(sa, cuf);

const root: VdomNode = {
  type: 'Root',
  children: [],
};

const dto: ComponentUnwrapperDto = {
  level: 0,
  dest: root.children!,
  componentId: compFunc.name,
  func: compFunc,
  props: {},
};

vu.unwrapComponent(dto, []);

console.dir(root, { depth: null });

import { AstProvider } from './ast/ast-provider';
import { LoggerFactory } from './log/logger-factory';
import { StateAllocator } from './state/state-allocator';
import { ComponentUnwrapperFactory } from './vdom/component-unwrapper-factory';
import { VdomUnwrapper } from './vdom/vdom-unwrapper';
import {
  AnyObject,
  ComponentAllocationContext,
  ComponentFunc,
  Vnode,
} from './vdom/vdom.types';

const Products: ComponentFunc = (
  { name, count }: AnyObject,
  ctx: AnyObject,
) => {
  const imports: ComponentFunc[] = [];

  const template = `
  <div>
    <$map {items} $as .item>
      <p>item: {item}</p>
    </$map>
    <$if {hasSecret}>
      <small>{secret}</small>
    </$if>
  </div>`;

  const items: string[] = [];
  for (let i = 0; i < count; i++) {
    items.push(`${name} ${i + 1}`);
  }

  const attach = {
    items,
    hasSecret: !!ctx.secret,
    secret: ctx.secret,
  };

  return { imports, template, attach };
};

const Injector: ComponentFunc = (props: AnyObject, ctx: AnyObject) => {
  const imports: ComponentFunc[] = [];

  const template = `
  <table>
    <$inject .secret={secret}/>
  </table>`;

  const attach = {
    secret: 'ABC123',
  };

  return { imports, template, attach };
};

const App: ComponentFunc = (props: AnyObject, ctx: AnyObject) => {
  const imports: ComponentFunc[] = [Products, Injector];

  const template = `
  <div class="main">
    <$tag {customTag} $with class="cool"/>
    <Injector>
      <Products .name="Apple" .count={count}/>
    </Injector>
  </div>`;

  const attach = {
    customTag: 'div',
    count: 3,
  };

  return { imports, template, attach };
};

const loggerFactory = new LoggerFactory();
const astProvider = new AstProvider();
const stateAllocator = new StateAllocator();
const componentUnwrapperFactory = new ComponentUnwrapperFactory(
  loggerFactory,
  astProvider,
);

const vdomUnwrapper = new VdomUnwrapper(
  stateAllocator,
  componentUnwrapperFactory,
);

const tag: Vnode = {
  type: 'Root',
  children: [],
};

const allocCtx: ComponentAllocationContext = {
  id: 'App',
  func: App,
  props: {},
  ctx: {},
};

vdomUnwrapper.unwrapComponent(tag.children, allocCtx, 0);

console.dir(tag, { depth: null });

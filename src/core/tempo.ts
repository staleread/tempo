import { AstProvider } from '../ast/ast-provider';
import { DomUpdater } from '../dom/diff/dom-updater';
import { DomElem } from '../dom/dom.types';
import { DomEventRegister } from '../dom/events/dom-event-register';
import { LoggerFactory } from '../log/logger-factory';
import { ComponentUnwrapperFactory } from '../vdom/component-unwrapper-factory';
import { VdomUnwrapper } from '../vdom/vdom-unwrapper';
import { AnyObject, ComponentFunc } from '../vdom/vdom.types';
import { HooksDispatcher } from './hooks/hooks-dispatcher';
import { StateAllocator } from './state/state-allocator';

const loggerFactory = new LoggerFactory();
const astProvider = new AstProvider();

const compUnwrapperFactory = new ComponentUnwrapperFactory(
  loggerFactory,
  astProvider,
);

const stateAllocator = new StateAllocator();
const vdomUnwrapper = new VdomUnwrapper(
  stateAllocator,
  compUnwrapperFactory,
);

let hooksDispatcher: HooksDispatcher;

export function render(
  rootNode: DomElem,
  compFunc: ComponentFunc,
  props?: AnyObject,
): void {
  const eventRegister = new DomEventRegister(rootNode);
  const domUpdater = new DomUpdater(rootNode, eventRegister);

  const updateDom = () => {
    const vdom = vdomUnwrapper.unwrapVdom(compFunc, props);
    domUpdater.updateDom(vdom);
  };

  hooksDispatcher = new HooksDispatcher(stateAllocator, updateDom);
  updateDom();
}

export function useState<T>(initialValue: T): [T, (value: T) => void] {
  if (!hooksDispatcher) {
    throw new Error('Forbiden hook call outside component function');
  }
  return hooksDispatcher.useState(initialValue);
}

export function useRef<T>(initialValue: T | null): { current: T | null } {
  if (!hooksDispatcher) {
    throw new Error('Forbiden hook call outside component function');
  }
  return hooksDispatcher.useRef(initialValue);
}

export function useEffect(callback: () => void, deps?: any[]): void {
  if (!hooksDispatcher) {
    throw new Error('Forbiden hook call outside component function');
  }
  return hooksDispatcher.useEffect(callback, deps);
}

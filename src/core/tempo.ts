import { AstProvider } from '../ast/ast-provider';
import { DomUpdater } from '../dom/diff/dom-updater';
import { DomElem } from '../dom/dom.types';
import { DomEventRegister } from '../dom/events/dom-event-register';
import { LoggerFactory } from '../log/logger-factory';
import { ComponentUnwrapperFactory } from '../vdom/component-unwrapper-factory';
import { VdomUnwrapper } from '../vdom/vdom-unwrapper';
import {
  AnyObject,
  ComponentFunc,
  ComponentResult,
  ComponentUnwrapperDto,
  Injection,
  VdomNode,
} from '../vdom/vdom.types';
import { HooksDispatcher } from './hooks/hooks-dispatcher';
import { StateAllocator } from './state/state-allocator';

class Tempo {
  private readonly vdomUnwrapper: VdomUnwrapper;
  private readonly stateAllocator: StateAllocator;

  private updateDom: () => void = () => {};
  private hooksDispatcher?: HooksDispatcher;

  constructor() {
    const loggerFactory = new LoggerFactory();
    const astProvider = new AstProvider();

    const componentUnwrapperFactory = new ComponentUnwrapperFactory(
      loggerFactory,
      astProvider,
    );

    this.stateAllocator = new StateAllocator();

    this.vdomUnwrapper = new VdomUnwrapper(
      this.stateAllocator,
      componentUnwrapperFactory,
    );
  }

  public render(
    rootNode: DomElem,
    compFunc: ComponentFunc,
    props?: AnyObject,
  ): void {
    const eventRegister = new DomEventRegister(rootNode);
    const domUpdater = new DomUpdater(rootNode, eventRegister);

    this.updateDom = () => {
      const vdom = this.vdomUnwrapper.unwrapVdom(compFunc, props);
      domUpdater.updateDom(vdom);
    };

    this.hooksDispatcher = new HooksDispatcher(
      this.stateAllocator,
      this.updateDom,
    );

    this.updateDom();
  }

  public useState<T>(initialValue: T): [T, (value: T) => void] {
    if (!this.hooksDispatcher) {
      throw new Error('Forbiden hook call outside component function');
    }
    return this.hooksDispatcher.useState(initialValue);
  }

  public useRef<T>(initialValue: T | null): { current: T | null } {
    if (!this.hooksDispatcher) {
      throw new Error('Forbiden hook call outside component function');
    }
    return this.hooksDispatcher.useRef(initialValue);
  }

  public useEffect(callback: () => void, deps: any[] | undefined): void {
    if (!this.hooksDispatcher) {
      throw new Error('Forbiden hook call outside component function');
    }
    return this.hooksDispatcher.useEffect(callback, deps);
  }

  public useContext(contextKey: string): unknown {
    if (!this.hooksDispatcher) {
      throw new Error('Forbiden hook call outside component function');
    }
    return this.hooksDispatcher.useContext(contextKey);
  }
}

export default new Tempo();

import { StateAllocator } from '../core/state/state-allocator';
import { ComponentUnwrapperFactory } from './component-unwrapper-factory';
import { ComponentAllocationContext } from './vdom.types';
import { Vnode } from './vdom.types';

export class VdomUnwrapper {
  constructor(
    private readonly stateAllocator: StateAllocator,
    private readonly componentUnwrapperFactory: ComponentUnwrapperFactory,
  ) {}

  public unwrapComponent(
    dest: Vnode[],
    allocCtx: ComponentAllocationContext,
    level: number,
  ): void {
    if (level === 0) {
      this.stateAllocator.reset();
    }
    this.stateAllocator.loadState(allocCtx.id, level);

    const unwrapper =
      this.componentUnwrapperFactory.createComponentUnwrapper(
        level,
        dest,
        allocCtx,
        this,
      );
    unwrapper.run();
  }

  public skipComponent(componentId: string, level: number): void {
    this.stateAllocator.loadState(componentId, level);
    this.stateAllocator.cleanState();
  }
}

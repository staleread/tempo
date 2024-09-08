import { StateAllocator } from '../core/state/state-allocator';
import { ComponentUnwrapperFactory } from './component-unwrapper-factory';
import { VdomUnwrapperContext } from './vdom.types';
import { VdomNode } from './vdom.types';

export class VdomUnwrapper {
  constructor(
    private readonly stateAllocator: StateAllocator,
    private readonly componentUnwrapperFactory: ComponentUnwrapperFactory,
  ) {}

  public unwrapComponent(
    dest: VdomNode[],
    ctx: VdomUnwrapperContext,
    level: number,
  ): void {
    if (level === 0) {
      this.stateAllocator.reset();
    }
    this.stateAllocator.loadState(ctx.componentId, level);

    const unwrapper =
      this.componentUnwrapperFactory.createComponentUnwrapper(
        level,
        dest,
        ctx,
        this,
      );
    if (!unwrapper.tryUnwrap()) {
      throw new Error('Failed to unwrap ' + ctx.componentId);
    }
  }

  public skipComponent(componentId: string, level: number): void {
    this.stateAllocator.loadState(componentId, level);
    this.stateAllocator.cleanState();
  }
}

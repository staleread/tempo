import { StateAllocator } from '../core/state/state-allocator';
import { ComponentUnwrapperFactory } from './component-unwrapper-factory';
import { ComponentUnwrapperDto, Injection } from './vdom.types';
import { AnyObject, ComponentFunc, VdomNode } from './vdom.types';

export class VdomUnwrapper {
  constructor(
    private readonly stateAllocator: StateAllocator,
    private readonly componentUnwrapperFactory: ComponentUnwrapperFactory,
  ) {}

  public unwrapVdom(compFunc: ComponentFunc, props?: AnyObject): VdomNode {
    const root: VdomNode = {
      type: 'Root',
      children: [],
    };

    const dto: ComponentUnwrapperDto = {
      level: 0,
      dest: root.children!,
      componentId: compFunc.name,
      func: compFunc,
      props: props ? props : {},
    };

    const injections: Injection[] = [];

    this.unwrapComponent(dto, injections);
    return root;
  }

  public unwrapComponent(
    dto: ComponentUnwrapperDto,
    injections: Injection[],
  ): void {
    if (dto.level === 0) {
      this.stateAllocator.reset();
    }
    this.stateAllocator.loadState(dto.componentId, dto.level);
    this.stateAllocator.injectContext(injections);

    const unwrapper =
      this.componentUnwrapperFactory.createComponentUnwrapper(dto, this);

    if (!unwrapper.tryUnwrap()) {
      throw new Error('Failed to unwrap ' + dto.componentId);
    }
  }

  public skipComponent(componentId: string, level: number): void {
    this.stateAllocator.loadState(componentId, level);
    this.stateAllocator.cleanState();
  }
}

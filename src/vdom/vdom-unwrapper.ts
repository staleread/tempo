import { StateAllocator } from '../core/state/state-allocator';
import { ComponentUnwrapperFactory } from './component-unwrapper-factory';
import { ComponentUnwrapDto, Injection } from './vdom.types';
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

    const dto: ComponentUnwrapDto = {
      dest: root.children!,
      stateLevel: 0,
      componentFunc: compFunc,
      props: props ? props : {},
    };

    const injections: Injection[] = [];
    const componentId = compFunc.name;

    this.unwrapComponent(dto, injections, componentId);
    return root;
  }

  public unwrapComponent(
    dto: ComponentUnwrapDto,
    injections: Injection[],
    componentId: string | number,
  ): void {
    if (dto.stateLevel === 0) {
      this.stateAllocator.reset();
    }
    this.stateAllocator.loadState(dto.stateLevel, componentId);
    this.stateAllocator.injectContext(injections);

    const unwrapper =
      this.componentUnwrapperFactory.createComponentUnwrapper(dto, this);

    if (!unwrapper.tryUnwrap()) {
      throw new Error('Failed to unwrap ' + dto.componentFunc.name);
    }
  }

  public skipComponent(
    stateLevel: number,
    componentId: string | number,
  ): void {
    this.stateAllocator.loadState(stateLevel, componentId);
  }
}

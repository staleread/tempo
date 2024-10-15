import { StateAllocator } from '../core/state/state-allocator';
import { ComponentUnwrapperFactory } from './component-unwrapper-factory';
import { ComponentUnwrapDto } from './vdom.types';
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

    const componentId = compFunc.name;

    this.unwrapComponent(dto, componentId);
    return root;
  }

  public unwrapComponent(
    dto: ComponentUnwrapDto,
    componentId: string | number,
  ): void {
    if (dto.stateLevel === 0) {
      this.stateAllocator.reset();
    }
    this.stateAllocator.loadState(dto.stateLevel, componentId);

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

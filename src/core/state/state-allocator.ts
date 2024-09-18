import { Injection } from '../../vdom/vdom.types';
import { State } from './state.types';

export class StateAllocator {
  private readonly states: State[] = [];
  private stateIndex = -1;
  private cellIndex = -1;

  public useCell<T>(): [() => T | undefined, (x: T) => void] {
    this.cellIndex++;

    const stateIndex = this.stateIndex;
    const cellIndex = this.cellIndex;

    if (!this.states[stateIndex]) {
      throw new RangeError('Trying to access state before loading it');
    }

    return [
      () => this.states[stateIndex]!.cells[cellIndex] as T | undefined,
      (x: T) => (this.states[stateIndex]!.cells[cellIndex] = x),
    ];
  }

  public reset(): void {
    this.stateIndex = -1;
    this.cellIndex = -1;
  }

  public loadState(level: number, componentId: string | number): void {
    this.stateIndex++;
    this.cellIndex = -1;

    const state = this.states[this.stateIndex];

    if (!state || state.level < level) {
      this.allocateState(level, componentId);
      return;
    }
    if (state.componentId !== componentId || state.level !== level) {
      this.deallocateState();
      this.allocateState(level, componentId);
      return;
    }
  }

  public injectContext(injections: Injection[]): void {
    const currState = this.states[this.stateIndex];

    if (!currState) {
      throw new RangeError('Trying to access state before loading it');
    }
    if (!currState.contextMap) {
      currState.contextMap = new Map();
    }

    injections.forEach((i: Injection) => {
      currState.contextMap!.set(i.contextKey, i.value);
    });
  }

  public getContext(contextKey: string): unknown | undefined {
    let level: number;
    let index = this.stateIndex;

    while (index > 0) {
      const state = this.states[index]!;
      level = state.level;

      if (state.contextMap?.has(contextKey)) {
        return state.contextMap!.get(contextKey);
      }
      while (state.level === level) {
        index--;
      }
    }
    return undefined;
  }

  private allocateState(level: number, componentId: string | number): void {
    const state: State = {
      componentId,
      level,
      cells: [],
    };
    this.states.splice(this.stateIndex, 0, state);
  }

  private deallocateState(): void {
    const level = this.states[this.stateIndex]!.level;

    let index = this.stateIndex + 1;
    let curr = this.states[index];

    while (curr && curr.level > level) {
      curr = this.states[++index];
    }
    this.states.splice(this.stateIndex, index - this.stateIndex);
  }
}

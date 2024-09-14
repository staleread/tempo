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

  public loadState(tag: string, level: number): void {
    this.stateIndex++;
    this.cellIndex = -1;

    const state = this.states[this.stateIndex];

    if (!state || state.level < level) {
      this.allocateState(tag, level);
      return;
    }

    if (state.tag === tag && state.level === level) {
      return;
    }

    this.trimLevel();
    this.allocateState(tag, level);
  }

  public injectContext(injections: Injection[]): void {
    const currState: State | undefined = this.states[this.stateIndex];

    if (!currState) {
      throw new RangeError('Trying to access state before loading it');
    }

    injections.forEach((i: Injection) => {
      currState.contextMap.set(i.contextKey, i.value);
    });
  }

  public getContext(contextKey: string): unknown | undefined {
    let level: number;
    let index = this.stateIndex;

    while (index > 0) {
      const state = this.states[index]!;
      level = state.level;

      if (state.contextMap.has(contextKey)) {
        return state.contextMap.get(contextKey);
      }
      while (state.level === level) {
        index--;
      }
    }
    return undefined;
  }

  private allocateState(tag: string, level: number): void {
    const state: State = { tag, level, contextMap: new Map(), cells: [] };
    this.states.splice(this.stateIndex, 0, state);
  }

  private trimLevel(): void {
    const level = this.states[this.stateIndex]!.level;

    let index = this.stateIndex;
    let curr = this.states[index];

    while (curr && curr.level >= level) {
      curr = this.states[++index];
    }
    this.states.splice(this.stateIndex, index - this.stateIndex);
  }
}

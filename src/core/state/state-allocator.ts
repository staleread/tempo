import { State } from './state.types';

export class StateAllocator {
  private readonly states: State[] = [];
  private stateIndex = -1;
  private cellIndex = -1;

  public readCell(): [number, any] {
    this.cellIndex++;
    return [
      this.cellIndex,
      this.states[this.stateIndex].cells[this.cellIndex],
    ];
  }

  public setCellValue(index: number, value: any): void {
    this.states[this.stateIndex].cells[index] = value;
  }

  public reset(): void {
    this.stateIndex = -1;
    this.cellIndex = -1;
  }

  public loadState(tag: string, level: number) {
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

  public cleanState() {
    this.states[this.stateIndex].cells = [];

    const nextState = this.states[this.stateIndex + 1];

    if (nextState && nextState.level > this.states[this.stateIndex].level) {
      this.stateIndex++;
      this.trimLevel();
      this.stateIndex--;
    }
  }

  private allocateState(tag: string, level: number) {
    const state: State = { tag, level, cells: [] };
    this.states.splice(this.stateIndex, 0, state);
  }

  private trimLevel() {
    const level = this.states[this.stateIndex].level;

    let index = this.stateIndex;
    let curr = this.states[index];

    while (curr && curr.level >= level) {
      curr = this.states[++index];
    }
    this.states.splice(this.stateIndex, index - this.stateIndex);
  }
}

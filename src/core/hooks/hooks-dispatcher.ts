import { StateAllocator } from '../state/state-allocator';

export class HooksDispatcher {
  private timeout: number | null = null;

  constructor(
    private readonly stateAllocator: StateAllocator,
    private readonly updateDom: () => void,
  ) {}

  public useState<T>(initialValue: T): [T, (value: T) => void] {
    const [readCell, writeCell] = this.stateAllocator.useCell<T>();

    if (readCell() === undefined) {
      writeCell(initialValue);
    }

    const setValue = (newValue: T) => {
      if (Object.is(newValue, readCell())) {
        return;
      }
      writeCell(newValue);

      if (this.timeout) {
        return;
      }

      this.timeout = setTimeout(() => {
        this.updateDom();
        this.timeout = null;
      }, 0);
    };
    return [readCell()!, setValue];
  }

  public useRef<T>(initialValue: T | null): { current: T | null } {
    const [readRef, writeRef] = this.stateAllocator.useCell<{
      current: T | null;
    }>();

    if (readRef() === undefined) {
      writeRef({ current: initialValue });
    }
    return readRef()!;
  }

  public useEffect(callback: () => void, deps?: any[]): void {
    const [readDeps, writeDeps] = this.stateAllocator.useCell<
      any[] | undefined
    >();

    const oldDeps = readDeps();

    const hasChanges = oldDeps
      ? deps!.some((dep: any, i: number) => !Object.is(dep, oldDeps[i]))
      : false;

    if (!oldDeps || hasChanges) {
      setTimeout(callback, 0);
      writeDeps(deps);
    }
  }

  public useContext(contextKey: string): unknown {
    const maybeContext = this.stateAllocator.getContext(contextKey);

    if (maybeContext === undefined) {
      throw new Error(`Context with key "${contextKey}" is not reachable`);
    }
    return maybeContext;
  }
}

import { Ref } from './vdom.types';

export function isRef(ref: unknown): ref is Ref {
  if (typeof ref !== 'object' || ref === null) {
    return false;
  }
  return (
    'current' in ref &&
    (ref.current instanceof Element || ref.current === null)
  );
}

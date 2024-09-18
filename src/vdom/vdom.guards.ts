import { Ref } from './vdom.types';

export function isRef(ref: unknown): ref is Ref {
  return (
    typeof ref === 'object' &&
    ref !== null &&
    'current' in ref &&
    ref.current instanceof Element
  );
}

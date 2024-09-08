import { EventHandler } from '../../vdom/vdom.types';
export type VdomEvent = {
  nativeEventName: string;
  handler: (event: Event) => void;
};

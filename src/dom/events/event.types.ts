export type EventHandler = (e: Event) => void;
export type VdomEventType = 'click' | 'submit' | 'change' | 'input';

export type VdomEvent = {
  nativeEventName: string;
  handler: (event: Event) => void;
};

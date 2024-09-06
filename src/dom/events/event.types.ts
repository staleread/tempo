export type VdomEventType = 'click' | 'submit' | 'input' | 'change';

export type VdomEvent = {
  nativeEventName: string;
  handler: (event: Event) => void;
};

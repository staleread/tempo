import { DomElem } from '../dom.types';
import { VdomEvent, VdomEventType } from './event.types';

function getEventTargetElem(event: Event): DomElem | null {
  const target: EventTarget | null = event.target;

  return target instanceof Element ? (target as DomElem) : null;
}

export const eventStrategy: Record<VdomEventType, VdomEvent> = {
  click: {
    nativeEventName: 'click',
    handler: (event: Event) => {
      let domElem: DomElem | null = getEventTargetElem(event);

      while (domElem?._ref && !event.defaultPrevented) {
        domElem._ref.events['click']?.(event);
        domElem = domElem.parentElement;
      }
    },
  },
  submit: {
    nativeEventName: 'submit',
    handler: (event: Event) => {
      let domElem: DomElem | null = getEventTargetElem(event);

      while (domElem?._ref && !event.defaultPrevented) {
        if (domElem._ref.id === 'form') {
          domElem._ref.events['submit']?.(event);
        }
        domElem = domElem.parentElement;
      }
    },
  },
  change: {
    nativeEventName: 'change',
    handler: (event: Event) => {
      const domElem: DomElem | null = getEventTargetElem(event);
      if (!domElem?._ref) return;

      domElem._ref.events['change']?.(event);
    },
  },
  input: {
    nativeEventName: 'input',
    handler: (event: Event) => {
      const domElem: DomElem | null = getEventTargetElem(event);
      if (!domElem?._ref) return;

      domElem._ref.events['input']?.(event);
    },
  },
};

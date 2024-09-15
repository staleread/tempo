import { DomElem } from '../dom.types';
import { EventHandler, VdomEvent, VdomEventType } from './event.types';

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
        domElem._ref.eventsMap!.get('click')?.(event);
        domElem = domElem.parentElement;
      }
    },
  },
  submit: {
    nativeEventName: 'submit',
    handler: (event: Event) => {
      let domElem: DomElem | null = getEventTargetElem(event);

      while (domElem?._ref && !event.defaultPrevented) {
        if (domElem._ref.tag === 'form') {
          domElem._ref.eventsMap!.get('submit')?.(event);
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

      domElem._ref.eventsMap!.get('change')?.(event);
    },
  },
  input: {
    nativeEventName: 'input',
    handler: (event: Event) => {
      const domElem: DomElem | null = getEventTargetElem(event);
      if (!domElem?._ref) return;

      domElem._ref.eventsMap!.get('input')?.(event);
    },
  },
  blur: {
    nativeEventName: 'focusout',
    handler: (event: Event) => {
      const domElem: DomElem | null = getEventTargetElem(event);
      if (!domElem?._ref) return;

      domElem._ref.eventsMap!.get('blur')?.(event);
    },
  },
};

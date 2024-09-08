import { VdomEventType } from '../../ast/parser/parser.types';
import { eventStrategy } from './event-strategy';
import { VdomEvent } from './event.types';

export class DomEventRegister {
  private oldEvents: Set<VdomEventType> = new Set();
  private newEvents: Set<VdomEventType> = new Set();

  constructor(private readonly target: EventTarget) {}

  public register(eventType: VdomEventType): void {
    if (this.newEvents.has(eventType)) {
      return;
    }
    this.newEvents.add(eventType);

    const event: VdomEvent = eventStrategy[eventType];
    this.target.addEventListener(event.nativeEventName, event.handler);
  }

  public removeUnused(): void {
    this.oldEvents.forEach((eventType: VdomEventType) => {
      if (this.newEvents.has(eventType)) {
        return;
      }
      const event: VdomEvent = eventStrategy[eventType];
      this.target.removeEventListener(event.nativeEventName, event.handler);
    });
    this.oldEvents = this.newEvents;
    this.newEvents = new Set<VdomEventType>();
  }
}

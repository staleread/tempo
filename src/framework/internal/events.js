export const eventHandlers = [
    {
        nativeEventName: 'click',
        handler(event) {
            let node = event.target._ref;

            while (node && !event.defaultPrevented) {
                if (node.type !== 'TagNode') {
                    node = node.parent;
                    continue;
                }
                const handler = node.eventsMap.get('Click');

                if (handler) handler(event);
                node = node.parent;
            }
        }
    },
    {
        nativeEventName: 'submit',
        handler(event) {
            let node = event.target._ref;

            while (node && !event.defaultPrevented) {
                if (node.type !== 'TagNode' || node.tag !== 'form') {
                    node = node.parent;
                    continue;
                }
                const handler = node.eventsMap.get('Submit');

                if (handler) handler(event);
                node = node.parent;
            }
        }
    },
]
export const _eventHandlers = {
    Click: {
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
    }
}

export const eventHandlers = Object.values(_eventHandlers);
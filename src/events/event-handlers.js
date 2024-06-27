export const eventHandlers = {
    'Click': {
        nativeEvent: 'click',
        handler(event) {
            let node = event.target._ref;

            while (node && !event.defaultPrevented) {
                if (node.type !== 'TagNode') {
                    node = node.parent;
                    continue;
                }
                node.events['Click']?.(event);
                node = node.parent;
            }
        }
    },
    'Submit': {
        nativeEvent: 'submit',
        handler(event) {
            let node = event.target._ref;

            while (node && !event.defaultPrevented) {
                if (node.type !== 'TagNode' || node.tag !== 'form') {
                    node = node.parent;
                    continue;
                }
                node.events['Submit']?.(event);
                node = node.parent;
            }
        }
    },
    'Change': {
        nativeEvent: 'change',
        handler(event) {
            let node = event.target._ref;

            if (node.tag !== 'input') {
                throw new TypeError(`${node.tag} doesn't support onChange event`)
            }

            node.events['Change']?.(event);
        }
    },
    'Input': {
        nativeEvent: 'input',
        handler(event) {
            let node = event.target._ref;

            if (node.tag !== 'input') {
                throw new TypeError(`${node.tag} doesn't support onInput event`)
            }

            node.events['Input']?.(event);
        }
    }
}

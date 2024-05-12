import {renderAST, renderDiff} from "./internal/renderer.js";
import {parseNode} from "./internal/parser.js";
import {eventHandlers} from "./internal/events.js";

export const Serianilla = (function () {
    let _virtualDOM;
    let _rootComponent;
    let _val;

    const _attachEvents = () => {
        eventHandlers.forEach(({nativeEventName, handler}) => {
            _virtualDOM.ref.addEventListener(nativeEventName, handler);
        })
    }

    const _updateVirtualDOM = () => {
        const node = _rootComponent();

        const candidateDOM = {
            type: 'RootNode',
            children: [node]
        };
        node.parent = candidateDOM;
        renderDiff(_virtualDOM, candidateDOM);
    }

    return {
        render(rootElement, rootComponent) {
            _rootComponent = rootComponent;
            const node = rootComponent();

            _virtualDOM = {
                type: 'RootNode',
                ref: rootElement,
                children: [node]
            }
            node.parent = _virtualDOM;
            renderAST(_virtualDOM);
            _attachEvents();
        },

        createComponent(componentData) {
            return parseNode(componentData);
        },

        useState(initialValue) {
            _val = _val ?? initialValue;
            const setValue = (newValue) => {
                if (newValue === _val)
                    return;

                _val = newValue;
                _updateVirtualDOM();
            };
            return [_val, setValue];
        }
    }
})();
import {renderAST, renderDiff} from "./internal/renderer.js";
import {parseNode} from "./internal/parser.js";
import {eventHandlers} from "./internal/events.js";

export const Serianilla = (function () {
    let _virtualDOM;
    let _rootComponent;
    let _current = 0;
    let _hooks = [];

    const _attachEvents = () => {
        eventHandlers.forEach(({nativeEventName, handler}) => {
            _virtualDOM.ref.addEventListener(nativeEventName, handler);
        })
    }

    const _updateVirtualDOM = () => {
        _current = 0;
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
            _current = 0;
            _hooks = [];
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
            if (_hooks[_current] === undefined) {
                _hooks[_current] = initialValue;
            }
            const tmpStateIndex = _current;

            const setValue = (newValue) => {
                if (newValue === _hooks[tmpStateIndex])
                    return;

                _hooks[tmpStateIndex] = newValue;
                _updateVirtualDOM();
            };
            return [_hooks[_current++], setValue];
        }
    }
})();
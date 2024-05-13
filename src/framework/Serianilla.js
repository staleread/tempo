import {renderAST, renderDiff} from "./internal/renderer.js";
import {parseNode} from "./internal/parser.js";
import {eventHandlers} from "./internal/events.js";

export const Serianilla = (function () {
    let _virtualDOM;
    let _rootComponent;
    let _currentStateIndex = 0;
    let _states = [];

    const _attachEvents = () => {
        eventHandlers.forEach(({nativeEventName, handler}) => {
            _virtualDOM.ref.addEventListener(nativeEventName, handler);
        })
    }

    const _updateVirtualDOM = () => {
        _currentStateIndex = 0;
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
            _currentStateIndex = 0;
            _states = [];
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
            if (_states[_currentStateIndex] === undefined) {
                _states[_currentStateIndex] = initialValue;
            }
            const tmpStateIndex = _currentStateIndex;

            const setValue = (newValue) => {
                if (newValue === _states[tmpStateIndex])
                    return;

                _states[tmpStateIndex] = newValue;
                _updateVirtualDOM();
            };
            return [_states[_currentStateIndex++], setValue];
        }
    }
})();
import {renderAST, renderDiff} from "./internal/renderer.js";
import {parseNode} from "./internal/parser.js";
import {refreshEvents} from "./internal/events.js";

export const Serianilla = (function () {
    let _virtualDOM;
    let _rootComponent;
    let _current = 0;
    let _hooks = [];
    let _eventSet;

    const _updateVirtualDOM = () => {
        _current = 0;

        const componentInfo = _rootComponent();
        const newEventSet = componentInfo.eventSet;
        const node = componentInfo.ast;

        const candidateDOM = {
            type: 'RootNode',
            children: [node]
        };
        node.parent = candidateDOM;
        renderDiff(_virtualDOM, candidateDOM);

        refreshEvents(_virtualDOM.ref, _eventSet, newEventSet);
        _eventSet = newEventSet;
    }

    return {
        render(rootElement, rootComponent) {
            _current = 0;
            _hooks = [];
            _eventSet = new Set();
            _rootComponent = rootComponent;

            const componentInfo = rootComponent();
            const newEventSet = componentInfo.eventSet;
            const node = componentInfo.ast;

            _virtualDOM = {
                type: 'RootNode',
                ref: rootElement,
                children: [node]
            }
            node.parent = _virtualDOM;
            renderAST(_virtualDOM);

            refreshEvents(_virtualDOM.ref, _eventSet, newEventSet);
            _eventSet = newEventSet;
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
import {renderAST, renderDiff} from "./internal/renderer.js";
import {refreshEvents} from "./internal/events.js";
import {StateManager} from "./internal/state-manager.js";
import {unwrapComponentTree} from "./internal/unwrapper.js";
import {findUsedEvents} from "./internal/traversers.js";

export const Serianilla = (function () {
    const _templateMap = new Map();

    let _virtualDOM;
    let _rootComponent;
    let _eventSet;
    let _stateTimeout = null;
    let _stateManager;

    const _updateVirtualDOM = () => {
        _stateManager.reset();

        const node = unwrapComponentTree(_rootComponent, _stateManager, _templateMap);
        const newEventSet = findUsedEvents(node);

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
            _eventSet = new Set();
            _rootComponent = rootComponent;

            _stateManager = new StateManager();

            const node = unwrapComponentTree(_rootComponent, _stateManager, _templateMap);
            const newEventSet = findUsedEvents(node);

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

        useState(initialValue) {
            const states = _stateManager.currentBucket.states;
            const index = _stateManager.currentStateIndex;

            if (states[index] === undefined) {
                states[index] = initialValue;
            }

            const setValue = (newValue) => {
                if (newValue === states[index]) {
                    return;
                }
                states[index] = newValue;

                if (_stateTimeout) {
                    return;
                }
                _stateTimeout = setTimeout(() => {
                    _updateVirtualDOM()
                    _stateTimeout = null;
                }, 0);
            };

            return [states[index], setValue];
        }
    }
})();
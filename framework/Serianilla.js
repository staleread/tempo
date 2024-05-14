import {renderAST, renderDiff} from "./internal/renderer.js";
import {parseComponent} from "./internal/parser.js";
import {refreshEvents} from "./internal/events.js";

export const Serianilla = (function () {
    let _virtualDOM;
    let _rootComponent;
    let _stateIndex = -1;
    let _hooks = [];
    let _localStateIndex = 0;
    let _eventSet;
    let _stateTimeout = null;

    const _updateHooks = (tag, nesting) => {
        _localStateIndex = 0;
        _stateIndex++;

        const current = _hooks[_stateIndex];

        if (!current) {
            _hooks[_stateIndex] = {tag, nesting, states: []};
            return;
        }

        if (current.tag === tag && current.nesting === nesting) {
            return;
        }

        if (current.tag !== tag && current.nesting >= nesting) {
            let i = _stateIndex + 1;
            let hook = _hooks[i];

            while (hook && hook.nesting > nesting) {
                hook = _hooks[++i];
            }

            _hooks.splice(_stateIndex, i - _stateIndex);

            if (hook) {
                return;
            }

            _hooks[_stateIndex] = {tag, nesting, states: []};
            return;
        }

        if (current.nesting < nesting) {
            _hooks.splice(_stateIndex - 1, 0, {tag, nesting, states: []});
        }
    }

    const _updateVirtualDOM = () => {
        _stateIndex = -1;

        const componentInfo = parseComponent(_rootComponent(), 0, _updateHooks);
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
            _stateIndex = -1;
            _hooks = [];
            _eventSet = new Set();
            _rootComponent = rootComponent;

            const componentInfo = parseComponent(_rootComponent(), 0, _updateHooks);
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

        useState(initialValue) {
            const currentStates = _hooks[_stateIndex].states;

            if (currentStates[_localStateIndex] === undefined) {
                currentStates[_localStateIndex] = initialValue;
            }
            const tmpStateIndex = _localStateIndex;

            const setValue = (newValue) => {
                if (newValue === currentStates[tmpStateIndex]) {
                    return;
                }
                currentStates[tmpStateIndex] = newValue;

                if (_stateTimeout) {
                    return;
                }

                _stateTimeout = setTimeout(() => {
                    console.log(`It's time to update DOM`)
                    _updateVirtualDOM()
                    _stateTimeout = null;
                }, 0);
            };
            return [currentStates[_localStateIndex++], setValue];
        }
    }
})();
export default class HooksDispatcher {
    constructor(stateManager, updateVirtualDOMCallback) {
        this._stateManager = stateManager;
        this._updateVirtualDOMCallback = updateVirtualDOMCallback;
        this._stateTimeout = null;
    }

    useState(initialValue) {
        const states = this._stateManager.currentBucket.states;
        const index = this._stateManager.currentStateIndex;

        if (states[index] === undefined) {
            states[index] = initialValue;
        }

        const setValue = (newValue) => {
            if (Object.is(newValue, states[index])) {
                return;
            }

            states[index] = newValue;

            if (this._stateTimeout) {
                return;
            }

            this._stateTimeout = setTimeout(() => {
                this._updateVirtualDOMCallback();
                this._stateTimeout = null;
            }, 0);
        };

        return [states[index], setValue];
    }
    
    useEffect(callback, deps) {
        const stateIndex = this._stateManager.currentStateIndex;

        const _deps = this._stateManager.currentBucket.states[stateIndex];
        const hasChanges = _deps ? deps.some((d, i) => !Object.is(d, _deps[i])) : false;

        if (!_deps || hasChanges) {
            setTimeout(callback, 0);
            this._stateManager.currentBucket.states[stateIndex] = deps;
        }
    }
    
    useRef(initialValue) {
        const states = this._stateManager.currentBucket.states;
        const index = this._stateManager.currentStateIndex;

        if (states[index] === undefined) {
            states[index] = {current: initialValue};
        }
        return states[index];
    }
}

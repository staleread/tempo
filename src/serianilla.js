import StateManager from "./state/state-manager";
import EventManager from "./events/event-manager";
import HookDispatcher from "./hooks/hooks-dispatcher";
import VirtualDOMUnwrapper from "./unwrap/virtual-dom-unwrapper";
import {renderAST, renderDiff} from "./render/renderer"

let stateManager;
let eventManager;
let hookDispatcher;
let domUnwrapper;
let virtualDOM;

const updateVirtualDOM = () => {
    stateManager.reset();

    const candidateDOM = domUnwrapper.unwrapVirtualDOM();

    renderDiff(virtualDOM, candidateDOM);
    eventManager.updateEvents(virtualDOM);
}

export const render = (rootElement, rootComponent) => {
    stateManager = new StateManager();
    eventManager = new EventManager(rootElement);
    hookDispatcher = new HookDispatcher(stateManager, updateVirtualDOM);
    domUnwrapper = new VirtualDOMUnwrapper(rootComponent, stateManager);
    
    virtualDOM = domUnwrapper.unwrapVirtualDOM();
    renderAST(virtualDOM, rootElement);
    eventManager.updateEvents(virtualDOM);
}

export const useState = (initialValue) => hookDispatcher.useState(initialValue);
export const useEffect = (callback, deps) => hookDispatcher.useEffect(callback, deps);
export const useRef = (initialValue) => hookDispatcher.useRef(initialValue);

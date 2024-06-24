import StateManager from './state/state-manager';
import EventManager from './events/event-manager';
import HookDispatcher from './hooks/hook-dispatcher';
import VirtualDOMUnwrapper from './unwrap/virtual-dom-unwrapper';

let stateManager;
let eventManager;
let hookDispatcher;
let vdUnwrapper;
let virtualDOM;

const updateVitrualDOM = () => {
    stateManager.reset();

    const candidateDOM = vdUnwrapper.unwrapVirtualDOM();

    renderDiff(virtualDOM, candidateDOM);
    eventManager.updateEvents(virtualDOM);
}

export const render = (rootElement, rootComponent) => {
    stateManager = new StateManager();
    eventManager = new EventManager(rootElement);
    hookDispatcher = new HookDispatcher(stateManager, updateVirtualDOM);
    vdUnwrapper = new VirtualDOMUnwrapper(rootComponent, stateManager);
    
    virtualDOM = vdUnwrapper.unwrapVirtualDOM();
    renderAST(virtualDOM);
    eventManager.updateEvents(virtualDOM);
}

export const useState = (initialValue) => hookDispatcher.useState(initialValue);
export const useEffect = (callback, deps) => hookDispatcher.useEffect(callback, deps);
export const useRef = (initialValue) => hookDispatcher.useRef(initialValue);

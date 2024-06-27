import {getSetDiff} from './utils';
import {eventHandlers} from './event-handlers';

export default class EventManager {
    constructor(targetElement) {
        this._target = targetElement;
        this._eventSet = new Set();
    }

    updateEvents(nodeTree) {
        const newEventSet = this._findUsedEvents(nodeTree);     

        getSetDiff(this._eventSet, newEventSet).forEach(e => {
            const {nativeEvent, handler} = eventHandlers[e];
            this._target.removeEventListener(nativeEvent, handler);
        });
        getSetDiff(newEventSet, this._eventSet).forEach(e => {
            const {nativeEvent, handler} = eventHandlers[e];
            this._target.addEventListener(nativeEvent, handler);
        });

        this._eventSet = newEventSet;
    }


    _findUsedEvents(nodeTree) {
        const eventSet = new Set();

        const processNode = (node) => {
            if (!node.shouldRender) {
                return;
            }
            if (node.events) {
                Object.keys(node.events).forEach(e => eventSet.add(e));
            }
            if (node.children) {
                node.children.forEach(child => processNode(child));
            }
        }

        processNode(nodeTree);
        return eventSet;
    }
}

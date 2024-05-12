import {renderDiff, renderTree} from "./traverser.js";

export const Serianilla = (function () {
    let _virtualDOM;
    let _rootComponent;
    let _val;

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
            renderTree(_virtualDOM);
        },

        useState(initialValue) {
            _val = _val ?? initialValue;
            const setValue = (newValue) => {
                _val = newValue;
                _updateVirtualDOM();
            };
            return [_val, setValue];
        }
    }
})();
import {printTree, renderTree} from "./traverser.js";

export const Serianilla = (function () {
    let virtualDOM;

    return {
        createRoot(root) {
            virtualDOM = {
                type: 'RootNode',
                ref: root,
                children: []
            }
        },

        render(node) {
            virtualDOM.children.push(node.ast);
            renderTree(virtualDOM)
        }
    }
})();
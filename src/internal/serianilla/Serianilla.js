import {printTree, renderTree} from "./traverser.js";

export class Serianilla {
    _virtualDOM = {};

    constructor(root) {
        this._virtualDOM = {
            type: 'RootNode',
            ref: root,
            children: []
        }
    }

    render(node) {
        this._virtualDOM.children.push(node.ast);
        renderTree(this._virtualDOM)
    }
}
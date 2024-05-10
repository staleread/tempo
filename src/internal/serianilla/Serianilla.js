import {printTree} from "./traverser.js";

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
        const ast = {
            type: 'RootNode',
            children: [node.ast]
        }

        printTree(ast)
    }
}
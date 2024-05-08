import {printTree} from "./traverser.js";
import {parseUnwrappedComponentNodes} from "./parser.js";

export class Serianilla {
    _virtualDOM = {};

    constructor(root) {
        this._virtualDOM = {
            type: 'RootNode',
            ref: root,
            children: []
        }
    }

    render(component) {
        const ast = {
            type: 'RootNode',
            children: parseUnwrappedComponentNodes(component())
        }
        printTree(ast)
    }
}
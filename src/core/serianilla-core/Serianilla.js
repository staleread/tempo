import {printTree} from "../serianilla-parser/traverser.js";
import {parseUnwrappedComponentNodes} from "../serianilla-parser/parser.js";

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
            children: []
        }

        ast.children = parseUnwrappedComponentNodes(component())
        console.log(ast)
        printTree(ast)
    }
}
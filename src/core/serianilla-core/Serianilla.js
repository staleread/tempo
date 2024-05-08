import {printTree} from "../serianilla-parser/traverser.js";
import {parseComponentChildren} from "../serianilla-parser/parser.js";

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

        ast.children = parseComponentChildren(component())
        console.log(ast)
        printTree(ast)
    }
}
import {printTree} from "../serianilla-parser/traverser.js";
import {parseComponentChildren} from "../serianilla-parser/parser.js";

export class Serianilla {
    _virtualDOM = {};

    constructor(root) {
        this._virtualDOM = {
            type: 'TagNode',
            tag: root.localName,
            ref: root,
            children: []
        }
    }

    render(component) {
        const ast = {
            type: this._virtualDOM.type,
            tag: this._virtualDOM.tag,
            children: []
        }

        ast.children = parseComponentChildren(component())
        console.log(ast)
        printTree(ast)
    }
}
import {printTree} from "./traverser.js";
import {parseNode} from "./parser.js";
import {tokenize} from "./tokenizer.js";

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

        const obj = component();
        console.log('TOKENS', tokenize(obj.template))

        const nodeTree = parseNode(obj);
        console.log('NODE TREE', nodeTree)

        ast.children.push(nodeTree);

        printTree(ast)
    }
}
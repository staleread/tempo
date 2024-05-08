import {printTree} from "../serianilla-parser/traverser.js";
import {parseNodeList} from "../serianilla-parser/parser.js";
import {tokenize} from "../serianilla-parser/tokenizer.js";

export class Serianilla {
    _virtualDOM = {};
    constructor(root) {
        this._root = root;

        this._virtualDOM = {
            type: 'PrimitiveNode',
            name: root.localName,
            ref: root,
            children: []
        }
    }

    static _createVirtualRoot(root) {
        return {
            type: 'PrimitiveNode',
            name: root.localName,
            ref: root,
            children: []
        }
    }

    render({input, values, imports}) {
        const ast = {
            type: this._virtualDOM.type,
            name: this._virtualDOM.name,
            children: []
        }

        const valuesMap = new Map(Object.entries(values));
        ast.children = parseNodeList(tokenize(input), valuesMap)
        console.log(ast)
        // printTree(ast)
    }

    _serialRender = ({input, values, imports}) => {

    }
}
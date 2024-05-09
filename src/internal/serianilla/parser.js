import {tokenize} from "./tokenizer.js";

export function parseNode({template, imports, attach}) {
    const attachMap = attach ? new Map(Object.entries(attach)) : new Map();
    const importsMap = imports ? new Map(Object.entries(imports)) : new Map();

    const tokens = tokenize(template);
    let current = 0;

    const walkChildNode = () => {
        let token = tokens[current];

        if (token.type === 'tag' &&
            token.body === 'start' &&
            token.isCustom) {

            const node = {
                type: 'TagNode',
                tag: 'div',
                attrs: [{name: 'class', value: token.name}],
                children: []
            };

            token = tokens[++current];
            const props = {}

            while (token.type !== 'tag' && token.body !== 'end') {
                // TODO disable custom tag attributes

                if (token.type === 'props') {
                    props[token.name] = token.valueType === 'serial' ? attachMap.get(token.value) : token.value;
                } else if (token.type === 'attr') {
                    node.attrs.push({
                        name: token.name,
                        value: token.valueType === 'serial' ? attachMap.get(token.value) : token.value
                    })
                } else {
                    throw new TypeError(`Invalid token found inside tag body`);
                }

                token = tokens[++current];
            }

            const component = importsMap.get(token.name);
            node.children = [parseNode(component(props))];

            // skip all implicit child nodes
            token = tokens[++current];
            while (token.type !== 'tag' && token.children !== 'end') {
                token = tokens[++current];
            }
            current++;

            return node;
        }
        if (token.type === 'tag' &&
            token.body === 'start' &&
            !token.isCustom) {

            const node = {
                type: 'TagNode',
                tag: token.name,
                attrs: [],
                children: []
            }

            token = tokens[++current];

            while (token.type !== 'tag' && token.body !== 'end') {
                if (token.type === 'attr') {
                    node.attrs.push({
                        name: token.name,
                        value: token.valueType === 'serial' ? attachMap.get(token.value) : token.value
                    })
                } else {
                    throw new TypeError(`Invalid token found inside tag body`);
                }

                token = tokens[++current];
            }

            if (!token.children) {
                return node;
            }

            token = tokens[++current];

            while (token.type !== 'tag' || token.children !== 'end') {
                node.children.push(walkChildNode());
                token = tokens[current];
            }

            current++;
            return node;
        }
        if (token.type === 'text') {
            current++;

            return {
                type: 'TextNode',
                value: token.value
            }
        }
        if (token.type === 'serial') {
            current++;

            return {
                type: 'TextNode',
                value: attachMap.get(token.value)
            }
        }
        if (current >= tokens.length) {
            return
        }

        throw new TypeError(`Invalid node type at ${current}: "${token.type}". Child node expected`)
    }

    const ast = walkChildNode();

    if (current < tokens.length) {
        throw new TypeError(`${tokens.length - current} extra tokens found after root. Only 1 node expected`)
    }
    return ast;
}
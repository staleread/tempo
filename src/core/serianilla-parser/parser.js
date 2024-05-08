import {tokenize} from "./tokenizer.js";

export function parseComponentChildren({template, imports, attach}) {
    const attachMap = new Map(Object.entries(attach ?? {}));
    const importsMap = new Map(Object.entries(imports ?? {}));

    const tokens = tokenize(template);
    let current = 0;

    const walkChildNode = () => {
        let token = tokens[current];

        if (token.type === 'tag' &&
            token.body === 'start' &&
            token.isCustom) {

            const node = {
                type: 'PrimitiveNode',
                name: 'div',
                attrs: [{name: 'class', value: token.name}],
                props: [],
                children: []
            };

            token = tokens[++current];

            while (token.type !== 'tag' && token.body !== 'end') {
                if (token.type === 'props') {
                    node.props.push({
                        name: token.name,
                        value: token.valueType === 'serial' ? attachMap.get(token.value) : token.value
                    })
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

            const componentFunc = importsMap.get(token.name);
            node.children = parseComponentChildren(componentFunc());

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
                type: 'PrimitiveNode',
                name: token.name,
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

    const nodes = [];

    while (current < tokens.length) {
        nodes.push(walkChildNode());
    }

    return nodes;
}
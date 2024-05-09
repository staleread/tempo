import {tokenize} from "./tokenizer.js";

export function parseNode({template, imports, attach}) {
    const attachMap = attach ? new Map(Object.entries(attach)) : new Map();
    const importsMap = imports ? new Map(Object.entries(imports)) : new Map();

    const tokens = tokenize(template);
    console.log(tokens)
    let current = 0;

    const walkChildNode = () => {
        let token = tokens[current];

        if (token.type === 'tag' &&
            token.body === 'start' &&
            token.isCustom) {

            const componentName = token.name
            const props = {}

            token = tokens[++current];

            while (token.type !== 'tag' && token.body !== 'end') {
                if (token.type !== 'props') {
                    throw new TypeError(`Invalid token with type "${token.type}" found inside custom tag body`);
                }

                props[token.name] = token.valueType === 'serial' ? attachMap.get(token.value) : token.value;
                token = tokens[++current];
            }

            const component = importsMap.get(componentName);
            const node = component(props);

            if (token.children !== 'start') {
                return node;
            }

            token = tokens[++current];

            if (!(token.type === 'tag' && token.children === 'end')) {
                throw new TypeError('Custom tags must be child free')
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
                    throw new TypeError(`Invalid token with type "${token.type}" found inside tag body`);
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
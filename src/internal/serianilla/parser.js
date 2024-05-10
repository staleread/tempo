import {tokenize} from "./tokenizer.js";

const SUPPORTED_COMMANDS = ['map']

export function parseNode({template, imports, attach}) {
    const attachMap = attach ? new Map(Object.entries(attach)) : new Map();
    const importsMap = imports ? new Map(Object.entries(imports)) : new Map();
    const contextMap = new Map();

    const tokens = tokenize(template);
    console.log(tokens)
    let current = 0;

    const retrieveProps = (token) => {
        if (token.valueType === 'string') {
            return token.value;
        }
        if (token.valueType === 'ref') {
            return attachMap.get(token.value);
        }
        if (token.valueType !== 'ref-chain') {
            throw new TypeError(`Unresolved props value type: ${token.valueType}`);
        }

        const chainInfo = token.value;
        let value = contextMap.get(chainInfo.context);

        for (const chainMember of chainInfo.chain) {
            value = value[chainMember];
        }
        return value;
    }

    // contextMap.set('card', {price: {currency: 23}})
    //
    // console.log(retrieveProps({type: 'props', name: 'price', valueType: 'ref-chain', value: {
    //         context: 'card',
    //         chain: ['price', 'currency']
    //     }}));

    const walkCustomTag = () => {
        let token = tokens[current];

        const componentName = token.name
        const props = {}

        token = tokens[++current];

        while (token.type !== 'tag-body-end') {
            if (token.type !== 'props') {
                throw new TypeError(`Props expected, got "${token.type}" inside custom tag body`);
            }

            props[token.name] = retrieveProps(token);
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

    const walkNotCustomTag = () => {
        let token = tokens[current];

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
            } else if (token.type === 'cmd') {
                // handle command
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

    const walkChildNode = () => {
        let token = tokens[current];

        if (token.type === 'text') {
            current++;
            return {type: 'TextNode', value: token.value};
        }

        if (token.type !== 'tag-body-start') {
            throw new TypeError(`Expected an opening tag, got "${token.type}"`);
        }

        return token.isCustom
            ? walkCustomTag()
            : walkNotCustomTag();
    }

    const ast = walkChildNode();

    if (current < tokens.length) {
        throw new TypeError(`${tokens.length - current} extra tokens found after root. Only 1 node expected`)
    }
    return ast;
}
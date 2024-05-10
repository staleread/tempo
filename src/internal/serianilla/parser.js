import {tokenize} from "./tokenizer.js";

export function parseNode({template, imports, attach}) {
    const attachMap = attach ? new Map(Object.entries(attach)) : new Map();
    const importsMap = imports ? new Map(Object.entries(imports)) : new Map();
    const contextMap = new Map();

    const tokens = tokenize(template);
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

    const retrieveAttributeValue = (token) => {
        if (token.valueType === 'empty') {
            return null;
        }
        if (token.valueType === 'string') {
            return token.value;
        }
        if (token.valueType === 'ref') {
            return attachMap.get(token.value);
        }
        if (token.valueType !== 'ref-chain') {
            throw new TypeError(`Unresolved attribute value type: ${token.valueType}`);
        }

        const chainInfo = token.value;
        let value = contextMap.get(chainInfo.context);

        for (const chainMember of chainInfo.chain) {
            value = value[chainMember];
        }
        return value;
    }

    const retrieveEventHandler = (token) => {
        if (token.valueType === 'ref') {
            return attachMap.get(token.value);
        }
        if (token.valueType !== 'ref-chain') {
            throw new TypeError(`Unresolved event value type: ${token.valueType}`);
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
        const nodeInfo = component(props);

        if (nodeInfo.bubblingEvents) {
            bubblingEvents.push(...nodeInfo.bubblingEvents);
        }

        if (!token.isChildStart) {
            return nodeInfo.ast;
        }

        token = tokens[++current];

        if (token.type !== 'tag-child-end') {
            throw new TypeError('Custom tags must be without child nodes');
        }

        current++;
        return nodeInfo.ast;
    }

    const walkNotCustomTag = () => {
        let token = tokens[current];

        const node = {
            type: 'TagNode',
            tag: token.name,
            attrs: [],
            events: [],
            children: []
        }

        token = tokens[++current];

        while (token.type !== 'tag-body-end') {
            if (token.type === 'attr') {
                const attrValue = retrieveAttributeValue(token);
                node.attrs.push({name: token.name, value: attrValue});
            } else if (token.type === 'cmd' && token.name === 'map') {
                // TODO handle command
                // escape for now
            } else if (token.type === 'bubbling-event') {
                const handler = retrieveEventHandler(token);
                bubblingEvents.push({name: token.name, handler})
            } else if (token.type === 'implicit-event') {
                const handler = retrieveEventHandler(token);
                node.events.push({name: token.name, handler})
            } else {
                throw new TypeError(`Invalid token "${token.type}" found inside tag body`);
            }
            token = tokens[++current];
        }

        if (!token.isChildStart) {
            current++;
            return node;
        }

        token = tokens[++current];

        while (token.type !== 'tag-child-end') {
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

    const bubblingEvents = []
    const ast = walkChildNode();

    if (current < tokens.length) {
        throw new TypeError(`${tokens.length - current} extra tokens found after root. Only 1 node expected`)
    }

    return {ast, bubblingEvents};
}
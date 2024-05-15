const acceptedCommands = {
    map: {
        paramsCount: 2,
        expectedParams: {
            context: {
                expectedValueTypes: ['string']
            },
            items: {
                expectedValueTypes: ['ref', 'ref-chain']
            }
        }
    },
    if: {
        paramsCount: 1,
        expectedParams: {
            true: {
                expectedValueTypes: ['ref', 'ref-chain']
            }
        }
    }
}

const walkChildNode = (tokens, current, parent) => {
    let token = tokens[current];

    if (token.type === 'text') {
        const node = {
            type: 'TextNode',
            value: token.value,
            parent
        }
        current++;
        return [node, current];
    }

    if (token.isCustom) {
        const node = {
            type: 'CustomNode',
            name: token.name,
            propsMap: new Map(),
            parent,
            children: []
        }

        token = tokens[++current];

        while (token.type !== 'tag-body-end') {
            if (token.type !== 'props') {
                throw new TypeError(`PARSER: Props expected, got "${token.type}" inside custom tag body`);
            }

            if (!['string', 'ref', 'ref-chain'].includes(token.valueType)) {
                throw new TypeError(`PARSER: Unresolved props value type: ${token.valueType}`);
            }

            const propsValueInfo = {
                valueType: token.valueType,
                value: token.value
            }
            node.propsMap.set(token.name, propsValueInfo);
            token = tokens[++current];
        }

        if (!token.isChildStart) {
            current++;
            return [node, current];
        }

        token = tokens[++current];

        if (token.type !== 'tag-child-end') {
            throw new TypeError('PARSER: By the way custom tags don\'t support child nodes');
        }

        current++;
        return [node, current];
    }

    if (!token.isCommand) {
        const node = {
            type: 'TagNode',
            tag: token.name,
            attrsMap: new Map(),
            eventsMap: new Map(),
            parent,
            children: []
        }

        token = tokens[++current];

        while (token.type !== 'tag-body-end') {
            if (token.type === 'attr') {
                if (!['empty', 'string', 'ref', 'ref-chain'].includes(token.valueType)) {
                    throw new TypeError(`PARSER: Unresolved event value type: ${token.valueType}`)
                }
                const valueInfo = {
                    valueType: token.valueType,
                    value: token.value
                }
                node.attrsMap.set(token.name, valueInfo);
                token = tokens[++current];
                continue;
            }
            if (token.type === 'event') {
                if (!['ref', 'ref-chain'].includes(token.valueType)) {
                    throw new TypeError(`PARSER: Unresolved event value type: ${token.valueType}`)
                }
                const valueInfo = {
                    valueType: token.valueType,
                    value: token.value
                }
                node.eventsMap.set(token.name, valueInfo);
                token = tokens[++current];
                continue;
            }
            throw new TypeError(`PARSER: Invalid token "${token.type}" found inside tag body`);
        }

        if (!token.isChildStart) {
            current++;
            return [node, current];
        }

        token = tokens[++current];

        while (token.type !== 'tag-child-end') {
            let child;
            [child, current] = walkChildNode(tokens, current, node);

            node.children.push(child);
            token = tokens[current];
        }

        if (token.name !== node.tag) {
            throw new TypeError(`PARSER: </${node.tag}> tag expected, got </${token.name}>. \nMaybe you forgot to put "/" at the end of the opening tag?`)
        }

        current++;
        return [node, current];
    }

    const cmdInfo = acceptedCommands[token.name];

    if (!cmdInfo) {
        throw new TypeError(`PARSER: Unknown command "${token.name}"`);
    }

    const node = {
        type: 'CommandNode',
        name: token.name,
        paramsMap: new Map(),
        parent,
        children: []
    }

    token = tokens[++current];

    for (let i = 0; i < cmdInfo.paramsCount; i++) {
        if (token.type !== 'param') {
            throw new TypeError(`PARSER: A command parameter expected, got "${token.type}"`);
        }
        const paramInfo = cmdInfo.expectedParams[token.name];

        if (!paramInfo) {
            throw new TypeError(`PARSER: Invalid command parameter "${token.name}"`)
        }
        if (!paramInfo.expectedValueTypes.includes(token.valueType)) {
            throw new TypeError(`PARSER: Invalid command parameter value type "${token.valueType}"`)
        }

        const valueInfo = {
            valueType: token.valueType,
            value: token.value
        }
        node.paramsMap.set(token.name, valueInfo);
    }

    token = tokens[++current];

    if (token.type !== 'tag-body-end') {
        throw new TypeError(`PARSER: ${node.name} command only allows ${cmdInfo.paramsCount} parameters`)
    }

    token = tokens[++current];

    while (token.type !== 'tag-child-end') {
        let child;
        [child, current] = walkChildNode(tokens, current, node);

        node.children.push(child);
        token = tokens[current];
    }

    if (token.name !== node.name) {
        throw new TypeError(`PARSER: </${node.name}> tag expected, got </${token.name}>. \nMaybe you forgot to put "/" at the end of the opening tag?`)
    }
    current++

    return [node, current];
}

export const parseComponentChild = (tokens) => {
    let ast, current = 0;
    [ast, current] = walkChildNode(tokens, current, null);

    if (current < tokens.length) {
        throw new TypeError(`${tokens.length - current} extra tokens found after root. Only 1 node expected`);
    }
    return ast;
}
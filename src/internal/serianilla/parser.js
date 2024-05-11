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

    const handleCommand = (cmdName, node) => {
        if (cmdName !== 'map') {
            throw new TypeError(`Unknown command "${cmdName}"`);
        }

        const PARAMS_COUNT = 2;
        let context = '';
        let items = [];

        let token = tokens[++current];

        for (let i = 0; i < PARAMS_COUNT; i++) {
            if (token.type !== 'param') {
                throw new TypeError(`A command parameter expected, got "${token.type}"`);
            }

            if (token.name === 'context') {
                context = retrieveProps(token);
                token = tokens[++current];
                continue;
            }

            if (token.name === 'items') {
                items = retrieveProps(token);
                token = tokens[++current];
                continue;
            }
            throw new TypeError(`Invalid command parameter "${token.name}"`);
        }

        if (token.type !== 'tag-body-end') {
            throw new TypeError(`Map command only allows ${PARAMS_COUNT} parameters`)
        }

        token = tokens[++current];
        const tmpCurrent = current;

        items.forEach(item => {
            current = tmpCurrent;
            token = tokens[current];
            contextMap.set(context, item);

            while (token.type !== 'tag-child-end') {
                node.children.push(walkChildNode());
                token = tokens[current];
            }
        });
        contextMap.delete(context);
        current++;
    }

    const walkCustomTag = (parent) => {
        let token = tokens[current];

        const nodeWrapper = {
            type: 'CustomNode',
            parent,
            children: []
        }

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
        node.parent = nodeWrapper;

        nodeWrapper.children.push(node);

        if (!token.isChildStart) {
            current++;
            return nodeWrapper;
        }

        token = tokens[++current];

        if (token.type !== 'tag-child-end') {
            throw new TypeError('Custom tags must be without child nodes');
        }

        current++;
        return nodeWrapper;
    }

    const walkNotCustomTag = (parent) => {
        let token = tokens[current];

        const node = {
            type: 'TagNode',
            tag: token.name,
            attrs: [],
            events: [],
            parent,
            children: []
        }

        token = tokens[++current];

        while (token.type !== 'tag-body-end') {
            if (token.type === 'attr') {
                const attrValue = retrieveAttributeValue(token);
                node.attrs.push({key: token.name, value: attrValue});
            }
            else if (token.type === 'event') {
                const handler = retrieveEventHandler(token);
                const event = {
                    eventName: token.name,
                    isBubbling: token.isBubbling,
                    handler
                };
                node.events.push(event);
            }
            else {
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
            if (!token.isCommand) {
                node.children.push(walkChildNode(node));
                token = tokens[current];
                continue;
            }
            handleCommand(token.name, node);
            token = tokens[current];
        }

        current++;
        return node;
    }

    const walkChildNode = (parent) => {
        let token = tokens[current];

        if (token.type === 'text') {
            current++;
            return {
                type: 'TextNode',
                value: token.value,
                parent
            };
        }

        if (token.isCommand) {
            throw new TypeError(`Command tags should be inside a regular tag`);
        }

        if (token.type !== 'tag-body-start') {
            throw new TypeError(`Expected an opening tag, got "${token.type}"`);
        }

        return token.isCustom
            ? walkCustomTag(parent)
            : walkNotCustomTag(parent);
    }

    const ast = walkChildNode(null);

    if (current < tokens.length) {
        throw new TypeError(`${tokens.length - current} extra tokens found after root. Only 1 node expected`)
    }
    return ast;
}
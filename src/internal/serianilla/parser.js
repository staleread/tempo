import {tokenize} from "./tokenizer.js";

export function parseNode({template, imports, attach}) {
    const attachMap = attach ? new Map(Object.entries(attach)) : new Map();
    const importsMap = imports ? new Map(Object.entries(imports)) : new Map();
    const contextMap = new Map();

    const tokens = tokenize(template);
    const bubblingEvents = [];
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
            }
            else if (token.type === 'bubbling-event') {
                const handler = retrieveEventHandler(token);
                bubblingEvents.push({name: token.name, handler});
            }
            else if (token.type === 'implicit-event') {
                const handler = retrieveEventHandler(token);
                node.events.push({name: token.name, handler});
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
                node.children.push(walkChildNode());
                token = tokens[current];
                continue;
            }
            handleCommand(token.name, node);
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

        if (token.isCommand) {
            throw new TypeError(`Command tags should be inside a regular tag`);
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
    return {ast, bubblingEvents};
}
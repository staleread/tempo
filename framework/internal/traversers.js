const retrieveValue = ({valueType, value}, attachMap) => {
    if (valueType === 'empty') {
        return null;
    }
    if (valueType === 'string') {
        return value.toString();
    }
    if (valueType === 'ref') {
        return attachMap.get(value);
    }
    if (valueType !== 'ref-chain') {
        throw new TypeError(`Unresolved value type: ${valueType}`);
    }

    const chainInfo = value;
    let result = attachMap.get(chainInfo.context);

    for (const chainMember of chainInfo.chain) {
        result = value[chainMember];
    }
    return result;
}

export const applyComponentAttachments = (node, attachMap, parentNode) => {
    const processNode = (node, parent, shouldRender) => {
        node.parent = parent;
        node.shouldRender = shouldRender;

        if (node.type === 'TagNode') {
            for (const [key, value] of Object.entries(node.attrs)) {
                node.attrs[key] = retrieveValue(value, attachMap)
            }
            for (const [key, value] of Object.entries(node.events)) {
                node.events[key] = retrieveValue(value, attachMap)
            }

            node.children.forEach(child => processNode(child, node, shouldRender));
            return;
        }
        if (node.type === 'CustomNode') {
            for (const [key, value] of Object.entries(node.props)) {
                node.props[key] = retrieveValue(value, attachMap)
            }
            return;
        }
        if (node.type === 'TextNode') {
            return;
        }
        if (node.type === 'CommandNode' && node.name === 'map') {
            if (!node.children) {
                return;
            }
            const context = retrieveValue(node.params.context, attachMap);
            const items = retrieveValue(node.params.items, attachMap);

            items.forEach((item, i) => {
                attachMap.set(context, item);
                if (i === 0) {
                    node.children.forEach(n => processNode(n, node));
                } else {
                    const nodesCopy = JSON.parse(JSON.stringify(node.children));
                    nodesCopy.forEach(n => processNode(n, node, shouldRender));
                    node.children.push(...nodesCopy);
                }
            })
            attachMap.remove(context);
            return;
        }
        if (node.type === 'CommandNode' && node.name === 'if') {
            const shouldRenderChildren = retrieveValue(node.params.true, attachMap);
            const index = parent.children.indexOf(node);

            const wrapper = {
                type: 'FragmentNode',
                key: node.name,
                shouldRender: shouldRenderChildren,
                children: node.children,
                parent,
            }

            // replace command node with a fragment node wrapper
            parent.children[index] = wrapper;

            wrapper.children.forEach(child => processNode(child, wrapper, shouldRenderChildren));
            return;
        }
        throw new TypeError(`ATTACH: Unknown node type found: "${node.type}"`)
    }
    processNode(node, parentNode, true);
}

export const findUsedEvents = (node) => {
    const eventSet = new Set();
    const processNode = (node) => {
        if (!node.shouldRender) {
            return;
        }
        if (node.events) {
            Object.keys(node.events).forEach(event => eventSet.add(event));
        }
        if (node.children) {
            node.children.forEach(child => processNode(child));
        }
    }
    processNode(node);
    return eventSet;
}

export const findCustomNodes = (node, importsMap) => {
    const nodes = [];
    const processNode = (node, index) => {
        if (node.type === 'CustomNode') {
            const ctr = importsMap.get(node.name);

            if (!ctr) {
                throw new TypeError(`Please, import ${node.name}`);
            }

            nodes.push({node, constructor: ctr, index});
            return;
        }
        if (node.children) {
            node.children.forEach((child, i) => processNode(child, i));
        }
    }
    processNode(node, 0);
    return nodes;
}
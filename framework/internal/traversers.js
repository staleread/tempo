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

        if (node.type === 'TextNode') {
            return;
        }
        if (node.type === 'CommandNode' && node.name === 'map') {
            if (!node.children) {
                return;
            }
            const context = retrieveValue(node.paramsMap.get('context'), attachMap);
            const items = retrieveValue(node.paramsMap.get('items'), attachMap);

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
            if (!node.children) {
                parent.children = [];   // if command node shouldn't go into output ast
                return;
            }

            const index = parent.children.indexOf(node);

            const shouldRenderChildren = retrieveValue(node.paramsMap.get('true'), attachMap);
            node.children.forEach(child => processNode(child, parent, shouldRenderChildren));

            parent.children.splice(index, 1, ...node.children);
            return;
        }
        if (node.type === 'CustomNode') {
            node.props = {};

            node.propsMap.forEach((v, k) => {
                node.props[k] = retrieveValue(v, attachMap);
            })
            delete node.propsMap;
            return;
        }
        if (node.type === 'TagNode') {
            node.attrsMap.forEach((v, k) => {
                node.attrsMap.set(k, retrieveValue(v, attachMap));
            })
            node.eventsMap.forEach((v, k) => {
                node.eventsMap.set(k, retrieveValue(v, attachMap));
            })

            node.children.forEach(child => processNode(child, node, shouldRender));
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
        if (node.eventsMap) {
            [...node.eventsMap.keys()].forEach(event => eventSet.add(event));
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
    const processNode = (node) => {
        if (node.type === 'CustomNode') {
            const constructor = importsMap.get(node.name);

            if (!constructor) {
                throw new TypeError(`Please, import ${node.name}`);
            }

            nodes.push({node, constructor});
            return;
        }
        if (node.children) {
            node.children.forEach(child => processNode(child));
        }
    }
    processNode(node);
    return nodes;
}

const unwrapStringValue = (stringValue, refs, attachMap) => {
    let lastPos = 0;
    let resultString = '';

    refs.forEach(r => {
        const refInfo = {
            valueType: r.refType,
            value: r.ref
        }
        const chunk = retrieveValue(refInfo, attachMap);

        if (chunk === undefined || chunk === null) {
            return;
        }

        resultString += stringValue.slice(lastPos, r.pos);
        resultString += chunk.toString();
        lastPos = r.pos;
    })

    if (lastPos < stringValue.length) {
        resultString += stringValue.slice(lastPos);
    }
    return resultString.trim();
}

const retrieveValue = ({valueType, value}, attachMap) => {
    if (valueType === 'empty') {
        return '';
    }
    if (valueType === 'string') {
        return unwrapStringValue(value.string, value.refs, attachMap);
    }
    if (valueType === 'ref') {
        const result = attachMap.get(value);

        if (result === undefined) {
            throw new TypeError(`Please attach a reference value of "${value}"`)
        }
        return result;
    }
    if (valueType !== 'ref-chain') {
        throw new TypeError(`Unresolved value type: ${valueType}`);
    }

    const chainInfo = value;
    let result = attachMap.get(chainInfo.context);

    if (result === undefined) {
        throw new TypeError(`Please attach a reference value of "${value}"`)
    }

    for (const chainMember of chainInfo.chain) {
        result = result[chainMember];
    }
    return result;
}

export const applyComponentAttachments = (node, attachMap, parentNode) => {
    const processNode = (node, parent, shouldRender) => {
        node.parent = parent;
        node.shouldRender = shouldRender;

        if (node.type === 'TagNode') {
            for (const [key, ref] of Object.entries(node.attrs)) {
                const value = retrieveValue(ref, attachMap);

                if (value === undefined || value === null) {
                    delete node.attrs[key];
                    continue
                }
                node.attrs[key] = value;
            }
            for (const [key, ref] of Object.entries(node.events)) {
                const value = retrieveValue(ref, attachMap);

                if (value === undefined || value === null) {
                    delete node.events[key];
                    continue
                }
                node.events[key] = value;
            }

            node.children.forEach(child => processNode(child, node, shouldRender));
            return;
        }
        if (node.type === 'CustomNode') {
            for (const [key, ref] of Object.entries(node.props)) {
                const value = retrieveValue(ref, attachMap);

                if (value === undefined || value === null) {
                    delete node.props[key];
                    continue
                }
                node.props[key] = value;
            }
            return;
        }
        if (node.type === 'TextNode') {
            node.value = unwrapStringValue(node.value.string, node.value.refs, attachMap);
            return;
        }
        if (node.type === 'CommandNode' && node.name === 'map') {
            const context = retrieveValue(node.params.context, attachMap);
            const items = retrieveValue(node.params.items, attachMap);
            const index = parent.children.indexOf(node);

            const wrapper = {
                type: 'FragmentNode',
                key: node.name,
                shouldRender: shouldRender,
                children: node.children,
                parent,
            }

            // replace command node with a fragment node wrapper
            parent.children[index] = wrapper;

            if (items.length === 0) {
                wrapper.children = [];
                return;
            }

            const sealedChildrenCopy = JSON.stringify(wrapper.children);

            items.forEach((item, i) => {
                attachMap.set(context, item);
                if (i === 0) {
                    wrapper.children.forEach(n => processNode(n, wrapper, shouldRender));
                    return;
                }
                const nodesCopy = JSON.parse(sealedChildrenCopy);
                nodesCopy.forEach(n => processNode(n, wrapper, shouldRender));
                node.children.push(...nodesCopy);
            })
            attachMap.delete(context);
            return;
        }
        if (node.type === 'CommandNode' && node.name === 'if') {
            const shouldRenderChildren = node.params.true
                ? retrieveValue(node.params.true, attachMap)
                : !retrieveValue(node.params.false, attachMap);

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
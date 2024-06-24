import {retrieveValue, unwrapStringValue} from "./utils";

export const applyComponentAttachments = (node, attach, parentNode) => {
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

    const attachMap = attach ? new Map(Object.entries(attach)) : new Map();
    processNode(node, parentNode, true);
}

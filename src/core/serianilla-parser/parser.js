export function parseNodeList(tokens) {
    let current = 0;

    const walkChildNode = () => {
        let token = tokens[current];

        if (token.type === 'tag' &&
            token.body === 'start' &&
            token.isCustom) {

            const node = {
                type: 'CustomNode',
                name: token.name,
                attrs: [],
                props: [],
                children: []
            };

            token = tokens[++current];

            while (token.type !== 'tag' && token.body !== 'end') {
                if (token.type === 'props') {
                    node.props.push({
                        name: token.name,
                        valueType: token.valueType,
                        value: token.value
                    })
                } else if (token.type === 'attr') {
                    node.attrs.push({
                        name: token.name,
                        valueType: token.valueType,
                        value: token.value
                    })
                } else {
                    throw new TypeError(`Invalid token found inside tag body`);
                }

                token = tokens[++current];
            }

            // ===== Custom tags' children are ignored =====
            // if (!token.children) {
            //     return node;
            // }
            //
            // while (token.type !== 'tag' && token.children !== 'end') {
            //     node.children.push(walkChildNode());
            //     token = tokens[current];
            // }
            // ==============================================

            current++;

            return node;
        }
        if (token.type === 'tag' &&
            token.body === 'start' &&
            !token.isCustom) {

            const node = {
                type: 'PrimitiveNode',
                name: token.name,
                attrs: [],
                children: []
            }

            token = tokens[++current];

            while (token.type !== 'tag' && token.body !== 'end') {
                if (token.type === 'attr') {
                    node.attrs.push({
                        name: token.name,
                        valueType: token.valueType,
                        value: token.value
                    })
                } else {
                    throw new TypeError(`Invalid token found inside tag body`);
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
                type: 'SerialValueNode',
                value: token.value
            }
        }

        if (current >= tokens.length) {
            return
        }

        throw new TypeError(`Invalid node type at ${current}: "${token.type}". Child node expected`)
    }

    const nodes = [];

    while (current < tokens.length) {
        nodes.push(walkChildNode());
    }

    return nodes;
}
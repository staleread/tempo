const traverseTree = (ast, parent, visitor) => {
    const traverse = (node, parent) => {
        if (visitor[node.type]?.onEnter) {
            visitor[node.type].onEnter(node, parent);
        }

        if (node.children) {
            traverseMany(node.children, node);
        }

        if (visitor[node.type]?.onExit) {
            visitor[node.type].onExit(node, parent);
        }
    }

    const traverseMany = (children, parent) => children.forEach(child => traverse(child, parent))

    traverse(ast, parent);
}

const renderVisitor = {
    TagNode: {
        onEnter: (node, parent) => {
            const elem = node.ref ?? document.createElement(node.tag);

            node.attrs.forEach(({key, value}) => {
                elem.setAttribute(key, value);
            })

            parent.ref.appendChild(elem)
            node.ref = elem;
        }
    },
    TextNode: {
        onEnter: (node, parent) => {
            parent.ref.innerText = node.value;
        }
    },
    CustomNode: {
        onEnter: (node, parent) => {
            node.ref = parent.ref;
        }
    },
}

export const renderTree = (ast, parent) => traverseTree(ast, parent, renderVisitor);
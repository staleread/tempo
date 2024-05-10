export function traverseTree(ast, visitor) {
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

    traverse(ast, null);
}

export const printTree = (ast) => traverseTree(ast, {
    RootNode: {
        onEnter: (node) => {
            console.log(`-> ROOT`)
        },
        onExit: (node) => {
            console.log(`<- ROOT`)
        },
    },
    TagNode: {
        onEnter: (node) => {
            console.log(`-> <${node.tag}>`)
        },
        onExit: (node) => {
            console.log(`<- <${node.tag}>`)
        },
    },
    TextNode: {
        onEnter: (node) => {
            console.log(`-> "${node.value}"`)
        },
        onExit: (node) => {
            console.log(`<- "${node.value}"`)
        }
    },
    CustomNode: {
        onEnter: () => {
            console.log(`-> CUSTOM`)
        },
        onExit: () => {
            console.log(`<- CUSTOM`)
        },
    },
})

export const renderTree = (ast) => traverseTree(ast, {
    TagNode: {
        onEnter: (node, parent) => {
            const elem = node.ref ?? document.createElement(node.tag);

            node.attrs.forEach(a => {
                elem.setAttribute(a.name, a.value);
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
})
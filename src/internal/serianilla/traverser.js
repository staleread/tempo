export function traverseTree(ast, visitor) {
    const traverse = (node) => {
        if (visitor[node.type]?.onEnter) {
            visitor[node.type].onEnter(node);
        }

        if (node.children) {
            traverseMany(node.children);
        }

        if (visitor[node.type]?.onExit) {
            visitor[node.type].onExit(node);
        }
    }

    const traverseMany = (children, parent) => {
        for (const child of children) {
            traverse(child, parent);
        }
    }

    traverse(ast);
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
})
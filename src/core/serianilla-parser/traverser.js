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
    CustomNode: {
        onEnter: (node) => {
            console.log('Found Custom Node: ' + node.name)
        }
    },
    PrimitiveNode: {
        onEnter: (node) => {
            console.log(`Found Primitive Node "${node.name}" with ${node.children.length} children`)
        }
    },
    TextNode: {
        onEnter: (node) => {
            console.log(`Found Text Node "${node.value}"`)
        },
        onExit: (node) => {
            console.log(`Goodbye Text Node "${node.value}"!`)
        }
    },
    SerialValueNode: {
        onEnter: (node) => {
            console.log(`Found Serial Node "${node.value}"`)
        }
    }
})
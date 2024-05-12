export const traverseTree = (ast, parent, visitor) => {
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
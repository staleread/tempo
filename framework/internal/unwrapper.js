import {tokenize} from "./tokenizer.js";
import {parseComponentChild} from "./parser.js";
import {applyComponentAttachments, findCustomNodes} from "./traversers.js";

export const unwrapComponentTree = (component, stateManager) => {
    const unwrapComponent = (component, parentNode, level) => {
        const {imports, template, attach} = component();

        const importsMap = imports ? new Map(Object.entries(imports)) : new Map();
        const attachMap = attach ? new Map(Object.entries(attach)) : new Map();

        const tokens = tokenize(template);
        const ast = parseComponentChild(tokens);
        parentNode.children.push(ast);
        applyComponentAttachments(ast, attachMap, parentNode);

        const customNodes = findCustomNodes(ast, importsMap);
        level++;
        customNodes.forEach(c => {
            if (c.node.shouldRender) {
                stateManager.loadBucket(c.constructor.name, level);
                unwrapComponent(c.constructor, c.node, level);
                return;
            }
            stateManager.loadBucket(c.constructor.name, level);
            stateManager.cleanBucket();
        });
    }

    const ast = {
        type: 'CustomNode',
        name: component.name,
        children: []
    }

    const level = 0;

    stateManager.loadBucket(component.name, level);
    unwrapComponent(component, ast, level)
    return ast;
}
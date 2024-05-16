import {tokenize} from "./tokenizer.js";
import {parseComponentChild} from "./parser.js";
import {applyComponentAttachments, findCustomNodes} from "./traversers.js";

export const unwrapComponentTree = (component, stateManager) => {
    const unwrapComponent = (componentCtr, props, parentNode, level) => {
        const {imports, template, attach} = componentCtr(props);

        const importsMap = imports ? new Map(Object.entries(imports)) : new Map();
        const attachMap = attach ? new Map(Object.entries(attach)) : new Map();

        const tokens = tokenize(template);
        const ast = parseComponentChild(tokens);
        parentNode.children.push(ast);
        applyComponentAttachments(ast, attachMap, parentNode);

        const customNodes = findCustomNodes(ast, importsMap);
        level++;

        customNodes.forEach(custom => {
            const fragment = {
                type: 'FragmentNode',
                key: custom.constructor.name,
                shouldRender: custom.node.shouldRender,
                parent: custom.node.parent,
                children: [],
            }

            custom.node.parent.children[custom.index] = fragment;

            if (fragment.shouldRender) {
                stateManager.loadBucket(fragment.key, level);
                unwrapComponent(custom.constructor, custom.node.props, fragment, level);
                return;
            }
            // reserve an empty bucket for those components that should not render
            stateManager.loadBucket(fragment.key, level);
            stateManager.cleanBucket();
        });
    }

    const fragment = {
        type: 'FragmentNode',
        key: component.name,
        shouldRender: true,
        children: [],
    }

    const level = 0;

    stateManager.loadBucket(component.name, level);
    unwrapComponent(component, {}, fragment, level);

    return fragment;
}
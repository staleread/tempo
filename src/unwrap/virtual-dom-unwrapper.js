import {tokenize} from './pipeline/tokenize/tokenizer';
import {parseComponentChild} from './pipeline/parse/parser';
import {applyComponentAttachments} from './pipeline/attach/apply-attachments';

export default class VirtualDOMUnwrapper {
    constuctor(rootComponent, stateManager) {
        this._rootComponent = rootComponent;
        this._stateManger = stateManager;
        this._templateMap = new Map();
    }

    unwrapVirtualDOM() {
        const level = 0;
        const props = {};
        const nodeName = this._rootComponent.name;

        const nodeTree = {
            type: 'RootNode',
            key: nodeName,
            shouldRender: true,
            children: [],
        }

        this._stateManager.loadBucket(nodeName, level);
        this._unwrapComponent(this._rootComponent, props, nodeTree, level);

        return nodeTree;
    }
    
    _unwrapComponent(componentCtr, props, parentNode, level) {
        const {imports, template, attach, hasDynamicInterpolation} = componentCtr(props);

        const importsMap = imports ? new Map(imports.map(c => [c.name, c])) : new Map();
        const ast = this._getAST(componentCtr.name, template, hasDynamicInterpolation);

        parentNode.children.push(ast);
        applyComponentAttachments(ast, attach, parentNode);

        const customNodes = this._findCustomNodes(ast, importsMap);
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
                this._stateManager.loadBucket(fragment.key, level);
                this._unwrapComponent(custom.constructor, custom.node.props, fragment, level);
                return;
            }

            // reserve an empty bucket for those components that should not render
            this._stateManager.loadBucket(fragment.key, level);
            this._stateManager.cleanBucket();
        });
    }
    
    _getAST(componentName, template, hasDynamicInterpolation) {
        if (hasDynamicInterpolation) {
            const tokens = tokenize(template);
            return parseComponentChild(tokens);
        } 

        let ast;
        const astString = this._templateMap.get(componentName);

        if (astString) {
            return JSON.parse(astString);
        } 

        const tokens = tokenize(template);
        const ast = parseComponentChild(tokens);

        this._templateMap.set(componentName, JSON.stringify(ast));
        return ast;
    }

    _findCustomNodes(nodeTree, importsMap) {
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

        processNode(nodeTree, 0);
        return nodes;
    }
}

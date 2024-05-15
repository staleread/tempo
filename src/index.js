import {App} from "./App.js";
import {tokenize} from "../framework/internal/tokenizer.js";
import {parseComponentChild} from "../framework/internal/parser.js";
import {applyComponentAttachments} from "../framework/internal/attacher.js";

// const root = document.getElementById('root');
// Serianilla.render(root, App);

const {imports, template, attach} = App();
const tokens = tokenize(template);
console.log('tokens:', tokens);

const ast = parseComponentChild(tokens);
console.log('ast:', ast);

const attachMap = attach ? new Map(Object.entries(attach)) : new Map();

applyComponentAttachments(ast, attachMap, null);
console.log('ast after attach:', ast);
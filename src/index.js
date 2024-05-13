import {Serianilla} from "../framework/Serianilla.js";
import {App} from "./App.js";
import Tab from "./web-components/Tab.js";

customElements.define('app-tab', Tab);

const root = document.getElementById('root');
Serianilla.render(root, App);
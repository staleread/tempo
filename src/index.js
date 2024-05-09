import {Serianilla} from "./internal/serianilla/Serianilla.js";
import {App} from "./App.js";

const ser = new Serianilla(document.getElementById('root'));
ser.render(App())
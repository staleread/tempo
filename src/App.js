import {Serianilla} from "../framework/Serianilla.js";
import {Auth} from "./pages/Auth.js";

export const App = () => {
    return Serianilla.createComponent({
        imports: {Auth},
        attach: {},
        template: `
        <div>
             <Auth/>   
        </div>`
    })
}
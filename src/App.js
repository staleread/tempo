import {Auth} from "./pages/Auth.js";

export const App = () => {
    return {
        imports: {Auth},
        attach: {},
        template: `
        <div>
             <Auth/>   
        </div>`
    }
}
import {Auth} from "./pages/Auth.js";

export const App = () => {
    const imports = {Auth};

    const template = `
    <div>
        <Auth/>   
    </div>`;

    const attach = {};

    return {imports, template, attach};
}
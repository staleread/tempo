import {Auth} from "./pages/Auth.js";

export const App = () => {
    const imports = {Auth};

    const template = `
    <div>
        <$if true={hello}>
            <Auth/>   
        </$if>
    </div>`;

    const attach = {};

    return {imports, template, attach};
}
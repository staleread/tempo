import {Auth} from "./pages/Auth.js";

export const App = () => {
    const imports = {Auth};

    const template = `
    <div number={number}>
        <Auth onClick={handle} prop={a}/>
    </div>`;

    const attach = {
        a: 'hello',
        number: 12,
        handle: e => console.log('Hello!'),
    };

    return {imports, template, attach};
}
import {Auth} from "./pages/Auth.js";

export const App = () => {
    const imports = {Auth};

    const template = `
    <div number={number}>
        <Auth onClick={handle} prop={a}/>
        <$if true={isComing}>
            <div>Let's go!</div>
        </$if>
    </div>`;

    const attach = {
        a: 'hello',
        number: 12,
        handle: e => console.log('Hello!'),
        isComing: 12 + 2 === 15
    };

    return {imports, template, attach};
}
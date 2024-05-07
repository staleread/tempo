import {tokenize} from "./core/vanilla-jsx.js";

// const text = `Hello, World`;
//const text = `<img src/> Some@#1 Text<img>!</img>`;

const text = `
<div>
    <button disabled onclick={hello}>Click Me!</button>
    <app-counter type="countdown"/>
    <ul>
        <article>
            <p>(title)</p>
            <button>Set favorite</button>
        </article>
    </ul>
</div>`

console.log(text);
console.log(tokenize(text));
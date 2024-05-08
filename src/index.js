import {tokenize} from "./core/vanilla-jsx.js";

// const text = `Hello, World`;
const text = `<img src="" alt=""/> Some@#1 Text <img src="lalala" alt="happy">!</img>`;

// const text = `
// <div>
//     <button onclick={sayHello} onhover={sayBye} disabled></button>
//     <app-counter class="counter" _initial={initial} _onTick={sayHello}></app-counter>
//     <ul $mapping={cards} $mapContext="card">
//         <article>
//             <p $context="card">(title)</p>
//             <button onclick={sayHello}>Set favorite</button>
//         </article>
//     </ul>
// </div>`

console.log(text);
console.log(tokenize(text));
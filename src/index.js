import {tokenize} from "./core/serianilla-parser/tokenizer.js";

const cards = [
    {title: 'Summer'},
    {title: 'Photoshop'}
]

const input = `
<div>
    <button onclick={sayHello} onhover={sayBye} disabled></button>
    <Counter class="counter" $initial={initial} $onTick={sayHello} $title="My clock"/>
    <ul> ${cards.map(c => `
        <article>
            <p>${c.title}</p>
            <button onclick={setFavorite}> Set Favorite for 10$ </button>
        </article>`).join('\n')}
    </ul>
</div>`

console.log(input)

const tokens = tokenize(input);
console.log(tokens)
import {tokenize} from "./core/serianilla-parser/tokenizer.js";

const cards = [
    {title: 'Summer'},
    {title: 'Photoshop'}
]

const input = `
<div>
    <button onclick={sayHello} onhover={sayBye} disabled></button>
    <Counter class="counter" $initial={initial} $onTick={sayHello}/>
    <ul> ${cards.map(c => `
        <article>
            <p>${c.title}</p>
            <button onclick={setFavorite}> Set favorite </button>
        </article>`).join('\n')}
    </ul>
</div>`

const tokens = tokenize(input);
console.log(tokens)
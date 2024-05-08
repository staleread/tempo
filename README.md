# my-friends
Simple frontend on Vanilla JS web components

## Serianilla 🍦

### Tokenizer

The current version of the tokenizer (almost 300 lines of JS) supports strict XML syntax (all tags should be closed, so `<img src="image.png">` without `/` will fail) and serial values wrapped into `{}` braces.

So for now the following code splits the input string into 41 tokens

```js
const cards = [
    {title: 'Summer'},
    {title: 'Photoshop'}
]

const input = `
<div>
    <button onclick={sayHello} onhover={sayBye} disabled></button>
    <app-counter class="counter" _initial={initial} _onTick={sayHello}/>
    <ul> ${cards.map(c => `
        <article>
            <p>${c.title}</p>
            <button onclick={setFavorite}> Set favorite </button>
        </article>`).join('\n')}
    </ul>
</div>`

const tokens = tokenize(input);

// {type: 'tag', name: 'div', body: 'start', children: null}
// {type: 'tag', name: 'div', body: 'end', children: 'start'}
// {type: 'tag', name: 'button', body: 'start', children: null}
// {type: 'attr', name: 'onclick', valueType: 'serial', value: 'sayHello'}
// ...
```
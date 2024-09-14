# Tempo concepts

> It was supposed to be a just lab on Web Programming, and ended up being
something more interesting...

As a lazy person I was looking for a way to simplify the workflow. I needed
something to make DOM manipulation more declarative, and to make stuff more
isolated, that is reusable.

A library like React was just what I needed. But using a framework for a JS lab
sounds like cheating, doesn't it? But creating a pseudo-React is not cheating.

Super slow, not optimized, with many bugs, but still a wrapper around regular DOM 😅

## Divide and conquer ⚔

Tempo allows you to split the presentation logic into consistent components.
This gives you the confidence that if something brakes down it's more likely
you to find that place. The component could be just a piece of UI like a
button or dropdown but some may be _smart_ holding the state and managing the
child components.

In order your component to be maintainable and scalable it should serve only
one purpose and live in separate files. Yes, it's sometimes a lot easier to
put all the stuff you need into a single component but when some bug emerge,
you'll regret it. Trust me.

## Empowering regular strings 🚀

> Imagine JSX was just a regular string...

In order to archive the syntax clarity and flexibility of JSX without
actually using any compiler, Tempo splits it into 3 components.

* `template` - a static string written in XML-like syntax.
* `imports` - a list of components referenced inside a `template`.
Enables component nesting.
* `attach` - a map of references (the words inside `{}` braces) and
their actual values. The dynamic part of the component.

You might use the following component structure:

```js
export const MyComponent = () => {
    const imports = [];

    const template = `
    <div>
        Your template...
    </div>`;

    const attach = {};

    return {imports, template, attach};
}
```

Under the hood, Tempo takes template through some stages to actually
render it.

> Thanks to the [Super tiny compiler](https://github.com/jamiebuilds/the-super-tiny-compiler)
> developing this part of "framework" was really fun.

### 1. Tokenization

Tokenization involves splitting the template string into small chunks called
tokens.

### 2. Parsing

The parsing functions consumes tokens, checks if their sequence order is correct
and generates an abstract syntax tree (AST).

### 3. Attaching refs and Processing commands

> At this stage the `attach` property comes into play

At this stage Tempo attaches actual values for `attrs`, `events`, `params`,
and `props` ("refs" for simplicity). The commands are also processed at this moment.

### 4. Unwrapping child components

> At this stage the `imports` property comes into play

At this stage Tempo first retrieves all child component nodes inside
the template. For each of them it checks the `shouldRender` flag and either loads
the stored state or cleans it if the component shouldn't be rendered.

## Commands

In Tempo commands are represented as HTML tags starting with `$`. In fact
these serve as a replacement for common JS expressions used in JSX.

### `$if`

modifies the `shouldRender` flag of the children according to a
condition passed as parameter.

> When it comes to state management `$if` command ensures each component has a
> "state bucket" reserved to avoid unexpected state loss in other components.
> That's why you should not use string interpolation for conditional rendering

Example:

```js
const template = `
<div>
    <$if true={isLoading}>
        <Loader/>
    </$if>
    <$if false={isLoading}>
        <ProductList/>
    </$if>
</div>`

const attach = {
    isLoading: true
}
```

### `$map`

_"For each item in `items` append a template inside a command tag with the item
`context` being injected"_

Let's use `$map` command to display a list of products:

```js

const template = `
<div>
    <h1>Product List<h1>
    <$map items={products} context="product">
        <div class="app__product-card">
            <h2>{product.name}</h2>
            <MyButton disabled={product.isOutOfStock} content="Purchase"/>
        </div>
    </$map>
</div>`

const attach = {
    products: [
        {name: 'Apple', isOutOfStock: false},
        {name: 'Blueberry', isOutOfStock: true},
    ]
}
```

## Revealing the magic of React hooks ✨

I really liked the idea of React hooks, as they looked like a true magic, like
something impossible to implement. But after doing some research I encountered
an article about [How do React hooks really work](https://www.netlify.com/blog/2019/03/11/deep-dive-how-do-react-hooks-really-work/),
which helped me a lot to understand the concepts behind this.

For now, Tempo supports custom implementations of `useState`, `useRef` and `useEffect`.

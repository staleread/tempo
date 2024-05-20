# Serianilla 🍦

In my recent JS project I was trying to pull some interesting concepts 
from modern JS frameworks like React. I truly loved JSX, that makes React 
components more clean and boosts the development.

Before meeting React the things like JS extensions wouldn't bother me, but now 
**_I wanted to implement this in Vanilla JS!_**

IMHO, importing compilers like Babel would be an overkill, so inspired by 
[Super tiny compiler](https://github.com/jamiebuilds/the-super-tiny-compiler), 
I decided to create somewhat similar, that is my own interpretation of JSX 🙂

## It's all about components

Serianilla allows splitting the presentation logic into consistent components.
Every component is just a function that returns a JS object. Let's display "Hello, World"
using Serianilla!

_index.html_
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My First App</title>
</head>
<body>

<main id="root"></main>

<script type="module" src="index.js"></script>
</body>
</html>
```

_index.js_
```js
import {Serianilla} from "./Serianilla.js";

const MyApp = () => {
    const template = 'Hello, World!';
    return {template};
}

const root = document.getElementById('root');
Serianilla.render(root, MyApp);
```

Quite simple, isn't it?

## Issues to solve
❌ Text node overwrites all sibling nodes 
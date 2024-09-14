# tempo ⚡

A library for spliting the UI into components and updating DOM in
a declarative way.

Strongly inspired by
- [React](https://github.com/facebook/react)
- [Super Tiny Compiler](https://github.com/jamiebuilds/the-super-tiny-compiler)
- [Cool compiler](https://github.com/alexjercan/cool-compiler)

## Get started

### Components

Any piece of your UI can be represented as a component.
A component is just a JS function returning
an object with 3 properties:

- `template` - a static string written in tempo language.
- `imports` (Optional) - a list of components referenced inside a `template`.
- `attach` (Optional) - a map of references (the words inside `{}` braces)
and their actual values. The dynamic part of the component.

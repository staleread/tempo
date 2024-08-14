# Serianilla 🍦

A library for spliting the UI into components and updating DOM in
a declarative way.

Strongly inspired by [React](https://github.com/facebook/react) and
[Super Tiny Compiler](https://github.com/jamiebuilds/the-super-tiny-compiler)

## Get started

### Components

Any piece of your UI can be represented as a component.
A Serianilla component is just a JS function returning
an object with 3 properties:

- `template` - a static string written in XML-like syntax.
- `imports` - a list of components referenced inside a `template`.
- `attach` - a map of references (the words inside `{}` braces) and
their actual values. The dynamic part of the component.

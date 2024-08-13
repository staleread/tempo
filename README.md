# Serianilla 🍦

> It was supposed to be a just lab on Web Programming, and ended up being
something more...

Just another declarative way to update DOM.
Inspired by [React](https://github.com/facebook/react).

## Language Grammar

> [!NOTE]
> The regular expression below are presented in a notation containing
> only 3 operations: concatenation, union and star (zero or more
> occurrences). I find these regex easier to transform into NFA,
> and then into DFA. And DFA itself is very programmable

| Token            | Regex                                             |
| ---------------- | ------------------------------------------------- |
| Opening tag start| `<`                                               |
| Opening tag end  | `/>`                                              |
| Closing tag start| `</`                                              |
| Tag end          | `>`                                               |
| Assign           | `=`                                               |
| Attach start     | `{`                                               |
| Attach end       | `}`                                               |
| Dot              | `.`                                               |
| String           | `"[^"]*"`                                         |
| Component        | `#[a-zA-Z][a-zA-Z]*`                              |
| Event            | `@[a-z][a-z]*`                                    |
| Keyword          | `$[a-z][a-z]*`                                    |
| Identifier       | `[a-zA-Z](-[a-zA-Z0-9][a-zA-Z0-9]*)*[a-zA-Z0-9]*` |

### Text mode

At the start of the template and after the end of either opening or
closing tag the text mode is turned on until the first tag token is
encountered. In this mode every character is consider a part of test node

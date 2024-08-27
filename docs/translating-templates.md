# Translating templates

## Scanning

### Scanning modes

Serianilla scanner has 2 modes: `text_on` and `text_off`. These are used
to correctly interpret the XML-like template syntax. Between `<>` the
scanner operates in text mode being off, that is treating each word
or symbol as a token. In other cases the scanner treats anything as a text.

### Supported tokens

| Token             | Regex                                             |
| ----------------- | ------------------------------------------------- |
| Left arrow        | `<`                                               |
| Right arrow       | `>`                                               |
| Slash             | `/`                                               |
| Equal             | `=`                                               |
| Left curl         | `{`                                               |
| Rigth curl        | `}`                                               |
| Dot               | `.`                                               |
| Quote             | `"`                                               |
| String            | `[^"<>{}][^"<>{}]*`                               |
| Component         | `#[A-Z][a-zA-Z]*`                                 |
| Event             | `@[a-z][a-z]*`                                    |
| Keyword           | `$[a-z][a-z]*`                                    |
| Comment           | `(!--)[^-]*(-[^-][^-]*)*(--)`                     |
| Identifier        | `[a-zA-Z][a-zA-Z0-9]*(-[a-zA-Z0-9][a-zA-Z0-9]*)*` |

> [!NOTE]
> The regular expression below are presented in a notation containing
> only 3 operations: concatenation, union (`∪`) and star (`*`).
> IMHO these are easier to convert into code.

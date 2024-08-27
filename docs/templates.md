# Serianilla templates
## Allowed tokens
### Mode transition tokens

| Token             | Regex                                             |
| ----------------- | ------------------------------------------------- |
| Left arrow        | `<`                                               |
| Right arrow       | `>`                                               |
| Left curl         | `{`                                               |
| Rigth curl        | `}`                                               |
| Quote             | `"`                                               |

### Tag mode tokens

| Token             | Regex                                             |
| ----------------- | ------------------------------------------------- |
| Slash             | `/`                                               |
| Equal             | `=`                                               |
| Component         | `[A-Z][a-zA-Z]*`                                  |
| Prop              | `.[a-z][a-zA-Z]*`                                 |
| Event             | `@[a-z][a-z]*`                                    |
| Keyword           | `$[a-z][a-z]*`                                    |
| Comment           | `(!--)[^-]*(-[^-][^-]*)*(--)`                     |
| Identifier        | `[a-z][a-zA-Z0-9]*(-[a-zA-Z0-9][a-zA-Z0-9]*)*`    |

### Var/Text-Var mode tokens

| Token             | Regex                                             |
| ----------------- | ------------------------------------------------- |
| Dot               | `.`                                               |
| VarId             | `[a-z][a-zA-Z]*`                                  |

### Text mode tokens

| Token             | Regex                                             |
| ----------------- | ------------------------------------------------- |
| String            | `[^"<>{}][^"<>{}]*`                               |

> [!NOTE]
> The regular expression above are presented in a notation containing
> only 3 operations: concatenation, union (`∪`) and star (`*`).
> IMHO these are easier to convert into code.

## Language grammar

Root Node
```
Rn <- Rn Tx | Tx Tg | Tg
```

Tag
```
Tg <- Bt | Mt | Ct
```

Basic tag
```
Bt  <- Bt1 < / id > | Bt2 / >
Bt1 <- Bt1 Tx | Bt1 Tg | Bt2 >
Bt2 <- Bt2 Sa | Bt2 Ea | < id
```

Component tag
```
Mt  <- Mt1 < / comp > | Mt2 / >
Mt1 <- Mt1 Tx | Mt1 Tg | Mt2 Tg
Mt2 <- Mt2 Tx | Mt3 >
Mt3 <- Mt3 Sa | Mt3 Va | < comp
```

Command tag
```
Ct <- Mp | If | Ch
```

Map expression
```
Mp  <- Mp1 < / $map >
Mp1 <- Mp1 Tx | Mp1 Tg | Mp2 Tg
Mp2 <- Mp2 Tx | < $map Vr $as id >
```

If expression
```
If  <- If1 < / $if >
If1 <- If1 Tx | If1 Tg | If2 Tg
If2 <- If2 Tx | < $if Vr > | < $if $not Vr >
```

Child expression
```
Ch  <- Ch1 / >
Ch1 <- Ch1 Sa | Ch1 Va | < $child
```

Attributes expressions
```
Sa <- id = St
Va <- prop = Vr
Ea <- event = Vr
```

String literal
```
St  <- St1 "
St1 <- St1 str | St1 Vr | " str | " Vr
```

Text
```
Tx <- Tx txt | Tx Vr | txt | Vr
```

Variable
```
Vr  <- Vr1 }
Vr1 <- Vr1 . vid | { vid
```

Comments (ignore them)
```
ε <- comment | < comment >
```

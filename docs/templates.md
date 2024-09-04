# Serianilla templates
## Language reference
### Terminal symbols

| Terminal    | Regex                                             |
| ----------- | ------------------------------------------------- |
| <           | `<`                                               |
| >           | `>`                                               |
| {           | `{`                                               |
| }           | `}`                                               |
| "           | `"`                                               |
| /           | `/`                                               |
| =           | `=`                                               |
| spread      | `*`                                               |
| dot         | `.`                                               |
| $map        | `$map`                                            |
| $if         | `$if`                                             |
| $not        | `$not`                                            |
| $tag        | `$tag`                                            |
| $comp       | `$comp`                                           |
| $with       | `$with`                                           |
| $children   | `$children`                                       |
| comp        | `[A-Z][a-zA-Z]*`                                  |
| prop        | `.[a-z][a-zA-Z]*`                                 |
| event       | `@[a-z][a-z]*`                                    |
| comment     | `(!--)[^-]*(-[^-][^-]*)*(--)`                     |
| id          | `[a-z][a-zA-Z0-9]*(-[a-zA-Z0-9][a-zA-Z0-9]*)*`    |
| vid         | `[a-z][a-zA-Z]*`                                  |
| str         | `[^"<>{}][^"<>{}]*`                               |

> [!NOTE]
> The regular expression above are presented in a notation containing
> only 3 operations: concatenation, union (`∪`) and star (`*`).
> IMHO these are easier to convert into code.

### Non terminal symbols

| Non terminal | Explanation               |
| ------------ | ------------------------- |
| Gl           | Goal                      |
| Tg           | Tag                       |
| Bt           | Basic tag                 |
| Bt1          |                           |
| Bt2          |                           |
| Cp           | Component tag             |
| Cp1          |                           |
| Mp           | Map command               |
| Mp           | Map command context       |
| If           | If command                |
| Ic           | If command condition      |
| Ht           | Gereric tag command       |
| Ht1          |                           |
| Hc           | Generic component command |
| Hc1          |                           |
| Cx           | Generic X command context |
| Sa           | String attribute          |
| Ea           | Event attribute           |
| Pr           | Property                  |
| Sp           | Spreaded property         |
| Sl           | String literal            |
| Sl1          |                           |
| Vr           | Variable literal          |
| Vr1          |                           |
| Tx           | Text node                 |
| Ck           | Text chunk                |

### Grammar rules

```
Gl  Tx Tg Tx
Tg  Bt
  | Cp
  | Mp
  | If
  | Ht
  | Hc
Bt  Bt1 < / id >
  | Bt2 / >
Bt1 Bt1 Tg
  | Bt1 Tx
  | Bt2 >
Bt2 Bt2 Sa
  | Bt2 Ea
  | < id
Cp  Cp1 > < / comp >
  | Cp1 > Tx Bt Tx < / comp >
  | Cp1 > Tx Cp Tx < / comp >
Cp1 Cp1 Sp
  | Cp1 Vp
  | Cp1 Pp
  | < comp
Mp  < Mx > Tx Tg Tx < / $map >
Mx  $map Vr $as prop
If  < Ic > Tx Tg Tx < / $if >
Ic  $if $not Vr
  | $if Vr
Ht  Ht1 / >
  | Ht1 > < / $comp >
Ht1 Ht1 Sa
  | Ht1 Ea
  | < $tag Cx
Hc  Hc1 / >
  | Hc1 > < / $comp >
Hc1 Hc1 Sp
  | Hc1 Vp
  | Hc1 Pp
  | < $comp Cx
Cx  Vr $with
Ch  < $children / >
  | < $children > < / $children >
Sa  id = Sl
Ea  event = Vr
Pr  prop = Sl
  | prop = Vr
Sp  spread = Vr
Sl  Sl1 "
Sl1 Sl1 str
  | Sl1 Vr
  | " str
  | " Vr
Vr  Vr1 }
Vr1 Vr1 dot vid
  | { vid
Tx  Tx Ck
  | ε
Ck  str
  | Vr
```

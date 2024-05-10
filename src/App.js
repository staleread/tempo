import {Card} from "./components/Card.js";
import {parseNode} from "./internal/serianilla/parser.js";

export const App = () => {
    const name = 'Nicolas';
    const cards = [
        {name: 'Apple', price: {amount: 2, currency: '$'}},
        {name: 'Carrot', price: {amount: 20, currency: 'грн'}}
    ]

    return parseNode({
        imports: {Card},
        template: `
        <div onclick={handleDivClick} onClick={handleClick}>
            <ul>
                <$map items={cards} context="card">
                    <Card
                        name={$card.name}
                        price={$card.price.amount}
                        currency={$card.price.currency}
                    ></Card>
                </$map>
            </ul>
            <button>Hello, ${name}!</button>
        </div>`,
        attach: {
            cards: cards,
            handleDivClick: () => console.log('Clicked implicitly!'),
            handleClick: () => console.log(name + ' clicked me!')
        }
    })
}
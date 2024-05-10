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
        <div empty-attr onclick={handleDivClick} onClick={handleClick}>
            <ul $map={mapCards}>
                <Card 
                    type="Super card" 
                    name={cardName} 
                    price={$card.price.amount} 
                    currency={$card.price.currency}
                ></Card>
            </ul>
            <button>Hello, ${name}!</button>
        </div>`,
        attach: {
            price: 15,
            mapCards: {list: cards, context: 'card'},
            cardName: 'My Card'
        }
    })
}
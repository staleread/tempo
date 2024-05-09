import {Card} from "./components/Card.js";
import {parseNode} from "./internal/serianilla/parser.js";

export const App = () => {
    const name = 'Nicolas';
    const cards = [
        {name: 'Apple', price: 4},
        {name: 'Carrot', price: 5}
    ]

    // return parseNode({
    //     imports: {Card},
    //     template: `
    //     <div>
    //         <ul $map={mapCards}>
    //             <Card name={$card.name} price={$card.price}></Card>
    //         </ul>
    //         <button>Hello, ${name}!</button>
    //     </div>`,
    //     attach: {
    //         price: 15,
    //         mapCards: {list: cards, context: 'card'}
    //     }
    // })

    return parseNode({
        imports: {Card},
        template: `
        <div>
            <ul $map={sdf}>
                <Card name={name} price={price}></Card>  
            </ul>
            <button>Hello, ${name}!</button>
        </div>`,
        attach: {
            name: cards[0].name,
            price: cards[0].price
        }
    })
}
import {Card} from "./components/Card.js";
import {parseNode} from "./internal/serianilla/parser.js";

export const App = () => {
    const name = 'Nicolas';

    return parseNode({
        imports: {Card},
        template: `
        <div>
            <Card name="Nicolas" price={price}></Card>
            <button>Hello, ${name}!</button>
        </div>`,
        attach: {price: 15}
    })
}

// TODO: how to implement mapped attachments? e.g. cards.map(c => ...)
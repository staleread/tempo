import {parseNode} from "../internal/serianilla/parser.js";

export const Card = ({name, price}) => {
    const TAX = 3;

    return parseNode({
        template: `
        <article>
            <h2>${name}</h2>
            <p>Price: ${price + TAX}$</p>
        </article>`
    });
}
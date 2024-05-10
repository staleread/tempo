import {parseNode} from "../internal/serianilla/parser.js";

export const Card = ({type, name, price, currency}) => {
    const TAX = 3;

    return parseNode({
        template: `
        <article>
            <h2>${name}</h2>
            <h3>Type: ${type}</h3>
            ${currency === 'грн'
                ? `<p>Price: ${price + TAX} грн</p>`
                : `<p>Price: ${currency}${price + TAX}</p>`
            }
        </article>`
    });
}
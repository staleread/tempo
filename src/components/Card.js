export const Card = ({name, price}) => {
    const TAX = 3;
    return {
        template: `
        <article>
            <h2>${name}</h2>
            <p>Price: ${price + TAX}$</p>
        </article>`
    }
}
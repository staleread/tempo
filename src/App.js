import {parseNode} from "./internal/serianilla/parser.js";
import {Counter} from "./components/Counter.js";

export const App = () => {
    const name = 'Nicolas';

    return parseNode({
        imports: {Counter},
        template: `
        <div onclick={handleDivClick} onClick={handleClick}>
            <Counter/>
        </div>`,
        attach: {
            handleDivClick: () => console.log('Clicked implicitly!'),
            handleClick: () => console.log(name + ' clicked me!')
        }
    })
}
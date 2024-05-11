import {parseNode} from "./internal/serianilla/parser.js";
import {Counter} from "./components/Counter.js";

export const App = () => {
    const name = 'Nicolas';
    let times = 1;

    return parseNode({
        imports: {Counter},
        template: `
        <div class="container" onClick={handleClick}>
            <Counter/>
        </div>`,
        attach: {
            handleClick: () => console.log(`${name} clicked me ${times++} times!`)
        }
    })
}
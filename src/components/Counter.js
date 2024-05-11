import {parseNode} from "../internal/serianilla/parser.js";
import {Serianilla} from "../internal/serianilla/Serianilla.js";

export const Counter = () => {
    const [count, setCount] = Serianilla.useState(1);

    return parseNode({
        template: `
        <div class="counter">
            <h2>Count: ${count}</h2>
            <button onclick={decrement}>Decrement</button>
            <button onclick={increment}>Increment</button>
        </div>`,
        attach: {
            decrement: () => {
                setCount(count - 1);
            },
            increment: () => {
                setCount(count + 1);
            }
        }
    });
}
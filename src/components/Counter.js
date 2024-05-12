import {Serianilla} from "../framework/Serianilla.js";

export const Counter = () => {
    const [count, setCount] = Serianilla.useState(1);

    return Serianilla.createComponent({
        template: `
        <div class="counter">
            <h2>Count: ${count}</h2>
            <button onClick={decrement}>Decrement</button>
            <button onClick={increment}>Increment</button>
        </div>`,
        attach: {
            decrement: () => setCount(count - 1),
            increment: () => setCount(count + 1)
        }
    });
}
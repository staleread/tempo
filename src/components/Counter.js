import {Serianilla} from "../framework/Serianilla.js";

export const Counter = () => {
    const [count, setCount] = Serianilla.useState(1);
    const [count2, setCount2] = Serianilla.useState(2);
    console.log("I'm rendered")

    return Serianilla.createComponent({
        template: `
        <div class="counter">
            <h2>Count #1: ${count}</h2>
            <h3>Count #2: ${count2}</h3>
            <button onClick={decrement}>Decrement</button>
            <button onClick={increment}>Increment</button>
        </div>`,
        attach: {
            decrement: () => setCount(count - 1),
            increment: () => {
                console.log('before', count)
                setCount(count + 1);
                setCount2(count2 + 2);
                console.log('after', count)
            },
        }
    });
}
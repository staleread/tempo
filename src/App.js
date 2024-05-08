import {TestComponent} from "./components/TestComponent.js";

export const App = () => {
    return {
        input: `
        <div>
            <TestComponent></TestComponent>
            <button>Hello, {name}!</button>
        </div>`,
        values: {
            name: 'Nicolas'
        },
        imports: {
            TestComponent
        }
    }
}
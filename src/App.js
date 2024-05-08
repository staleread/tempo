import {TestComponent} from "./components/TestComponent.js";

export const App = () => {
    const name = 'Nicolas';

    return {
        imports: {
            TestComponent
        },
        template: `
        <div>
            <TestComponent $data={secretData}></TestComponent>
            <button>Hello, ${name}!</button>
        </div>`,
        attach: {
            secretData: {
                title: 'Secret',
                text: 'Super secret information'
            }
        },
    }
}
import {Serianilla} from "./framework/Serianilla.js";
import {Counter} from "./components/Counter.js";
import {MyForm} from "./components/MyForm.js";

export const App = () => {
    const name = 'Nicolas';

    return Serianilla.createComponent({
        imports: {Counter, MyForm},
        template: `
        <div class="container" onClick={handleClick}>
            <Counter/>
            <MyForm defaultName="${name}"/>
        </div>`,
        attach: {
            handleClick: () => console.log(`The container is triggered`)
        }
    })
}
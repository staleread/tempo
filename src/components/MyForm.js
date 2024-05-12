import {Serianilla} from "../framework/Serianilla.js";

export const MyForm = ({defaultName}) => {

    return Serianilla.createComponent({
        template: `
        <form onSubmit={onSubmit}>
            <input type="text" name="name" id="name" value="${defaultName}"/>
            <button>Submit</button>
        </form>`,
        attach: {
            onSubmit: (e) => {
                e.preventDefault();
                console.log('The submission was cancelled, haha!')
            }
        }
    });
}
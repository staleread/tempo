import {Serianilla} from "../../framework/Serianilla.js";
import {SignUpForm} from "../components/SignUpForm.js";
import {LoginForm} from "../components/LoginForm.js";

export const Auth = () => {

    return Serianilla.createComponent({
        imports: {SignUpForm, LoginForm},
        attach: {
            onSignUp: () => {},
            onLogin: () => {},
        },
        template: `
        <div class="overlay">
            <app-tab>
                <section data-tabname="Sign Up">
                    <SignUpForm onValidSubmit={onSignUp}/>        
                </section>
                <section data-tabname="Log In">
                    <LoginForm onValidSubmit={onLogin}/>     
                </section>
            </app-tab>
        </div>`
    })
}
import {Serianilla} from "../../framework/Serianilla.js";
import {SignUpForm} from "../components/SignUpForm.js";
import {LoginForm} from "../components/LoginForm.js";

export const Auth = () => {
    const [activeTab, setActiveTab] = Serianilla.useState('login');

    const imports = {LoginForm, SignUpForm};

    const template = `
    <div class="auth__tabs-container">
        <div class="auth__nav">
            <button class="${activeTab === 'login' ? 'active' : ''}" onClick={setLogin}>Log In</button>
            <button class="${activeTab === 'signup' ? 'active' : ''}" onClick={setSignUp}>Sign Up</button>
        </div>
        <div class="auth__outlet">
            <$if true={login}>
                <SignUpForm/>   
            </$if>
            <p>Hello!</p>
            <$if true={login}>
               
            </$if>
           <LoginForm/>
        </div>
    </div>`;

    const attach = {
        setLogin: () => setActiveTab('login'),
        setSignUp: () => setActiveTab('signup'),
        login: activeTab === 'login'
    };

    return {imports, template, attach};
}
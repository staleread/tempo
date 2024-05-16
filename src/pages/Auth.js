import {Serianilla} from "../../framework/Serianilla.js";
import {SignUpForm} from "../components/SignUpForm.js";
import {LoginForm} from "../components/LoginForm.js";
import {Button} from "../components/ui/Button.js";
import {InputText} from "../components/ui/InputText.js";
import {InputPassword} from "../components/ui/InputPassword.js";

export const Auth = () => {
    const [activeTab, setActiveTab] = Serianilla.useState('login');

    const imports = {LoginForm, SignUpForm, InputText, InputPassword, Button};

    const template = `
    <div class="auth__container">
        <div class="auth__tabs">
            <Button 
                classes="auth__tab ${activeTab === 'login' ? 'active' : ''}" 
                onClick={setLogin} 
                content="Log in" />
            <Button 
                classes="auth__tab ${activeTab === 'signup' ? 'active' : ''}" 
                onClick={setSignUp} 
                content="Sign up" />
        </div>
        <div>
            <$if true={login}>
                <LoginForm onValidSubmit={onLogin}/>            
            </$if>
            <$if false={login}>
                <SignUpForm onValidSubmit={onSignup}/>            
            </$if>
        </div>
    </div>`;

    const attach = {
        setLogin: () => setActiveTab('login'),
        setSignUp: () => setActiveTab('signup'),
        login: activeTab === 'login',
        onLogin: () => {
            // some logic...
        },
        onSignup: () => {
            // some logic...
        },
    };

    return {imports, template, attach, hasDynamicInterpolation: true};
}
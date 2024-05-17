import {Serianilla} from "../../framework/Serianilla.js";
import {SignUpForm} from "../components/SignUpForm.js";
import {LoginForm} from "../components/LoginForm.js";
import {Button} from "../components/ui/Button.js";
import {InputText} from "../components/ui/InputText.js";
import {InputPassword} from "../components/ui/InputPassword.js";
import {Loader} from "../components/ui/Loader.js";
import {login} from "../services/auth-service.js";

export const Auth = () => {
    const [activeTab, setActiveTab] = Serianilla.useState('login');
    const [isLoading, setIsLoading] = Serianilla.useState(false);

    const imports = {LoginForm, SignUpForm, InputText, InputPassword, Button, Loader};

    const template = `
    <div class="${isLoading ? 'auth__container-loading' : 'auth__container'}">
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
        <div class="auth__form-container">
            ${activeTab === 'login'
                ? `<LoginForm onValidSubmit={onLogin}/>`
                : `<SignUpForm onValidSubmit={onSignup}/>`
            }   
            <$if true={isLoading}>
                <Loader/>            
            </$if>
        </div>
    </div>`;

    const attach = {
        isLoading,
        setLogin: () => setActiveTab('login'),
        setSignUp: () => setActiveTab('signup'),
        login: activeTab === 'login',
        onLogin: formData => {
            console.log('Thiinking...')
            setTimeout(() => {
                console.log('OK')
            }, 2000)
        },
        onSignup: formData => {
            console.log('Thiinking...')
            setTimeout(() => {
                console.log('OK')
            }, 2000)
        },
    };

    return {imports, template, attach, hasDynamicInterpolation: true};
}
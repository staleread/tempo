import {Serianilla} from "../../framework/Serianilla.js";
import {LoginForm} from "../components/LoginForm.js";
import {SignUpForm} from "../components/SignUpForm.js";
import {Button} from "../components/ui/Button.js";
import {InputText} from "../components/ui/InputText.js";
import {InputPassword} from "../components/ui/InputPassword.js";
import {Loader} from "../components/ui/Loader.js";
import {login, signUp} from "../services/auth-service.js";

export const Auth = ({onMessage}) => {
    const [activeTab, setActiveTab] = Serianilla.useState('signup');
    const [isLoading, setIsLoading] = Serianilla.useState(false);

    const imports = {SignUpForm, LoginForm, InputText, InputPassword, Button, Loader};

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
        onSignup: formData => {
            setIsLoading(true);
            signUp(formData).then(response => {
                onMessage({title: response.message, success: response.isSuccess});
                setIsLoading(false);
            })
        },
        onLogin: formData => {
            setIsLoading(true);
            login(formData).then(response => {
                onMessage({title: response.message, success: response.isSuccess});
                setIsLoading(false);
            })
        },
    };

    return {imports, template, attach, hasDynamicInterpolation: true};
}
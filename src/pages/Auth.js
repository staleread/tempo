import {Serianilla} from "../../framework/Serianilla.js";
import {LoginForm} from "../components/LoginForm.js";
import {SignUpForm} from "../components/SignUpForm.js";
import {Button} from "../components/ui/Button.js";
import {InputText} from "../components/ui/InputText.js";
import {InputPassword} from "../components/ui/InputPassword.js";
import {Loader} from "../components/ui/Loader.js";
import {login, signUp} from "../services/auth-service.js";

export const Auth = ({locationContext}) => {
    const [isLoading, setIsLoading] = Serianilla.useState(false);
    const isLogin = locationContext.pathname === '/login';

    const onValidLoginFormSubmit = async (formData) => {
        setIsLoading(true);
        const res = await login(formData);

        if (res.isSuccess) {
            locationContext.setPathname('/friends')
        } else {
            console.log(res.message);
        }
        setIsLoading(false);
    }

    const onValidSignupFormSubmit = async (formData) => {
        setIsLoading(true);
        const res = await signUp(formData);

        if (res.isSuccess) {
            locationContext.setPathname('/friends')
        } else {
            console.log(res.message);
        }
        setIsLoading(false);
    }

    const imports = [SignUpForm, LoginForm, InputText, InputPassword, Button, Loader];

    const template = `
    <div class="${isLoading ? 'auth__container-loading' : 'auth__container'}">
        <div class="auth__tabs">
            <Button 
                classes="auth__tab ${isLogin ? 'active' : ''}" 
                onClick={setLogin} 
                content="Log in" />
            <Button 
                classes="auth__tab ${isLogin ? '' : 'active'}" 
                onClick={setSignUp} 
                content="Sign up" />
        </div>
        <div class="auth__form-container">
            <$if true={isLogin}>
                <LoginForm onValidSubmit={onValidLoginFormSubmit}/>                
            </$if>
            <$if false={isLogin}>
                <SignUpForm onValidSubmit={onValidSignupFormSubmit}/>                
            </$if>
            <$if true={isLoading}>
                <Loader/>            
            </$if>
        </div>
    </div>`;

    const attach = {
        isLogin,
        isLoading,
        onValidLoginFormSubmit,
        onValidSignupFormSubmit,
        setLogin: () => locationContext.setPathname('/login'),
        setSignUp: () => locationContext.setPathname('/signup'),
    };

    return {imports, template, attach, hasDynamicInterpolation: true};
}
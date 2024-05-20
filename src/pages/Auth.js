import {Serianilla} from "../../framework/Serianilla.js";
import {LoginForm} from "../components/LoginForm.js";
import {SignUpForm} from "../components/SignUpForm.js";
import {Button} from "../components/ui/Button.js";
import {InputText} from "../components/ui/InputText.js";
import {InputPassword} from "../components/ui/InputPassword.js";
import {Loader} from "../components/ui/Loader.js";
import {login, signUp} from "../services/auth-service.js";
import {Notification} from "../components/ui/Notification.js";
import {FRIENDS_ROUTE} from "../routes.js";

export const Auth = ({locationContext}) => {
    const [isLoading, setIsLoading] = Serianilla.useState(false);
    const [notificationInfo, setNotificationInfo] = Serianilla.useState({
        isShown: false,
        title: '',
        message: '',
        status: 'error'
    });

    const isLogin = locationContext.pathname === '/login';

    const onValidLoginFormSubmit = async (formData) => {
        setIsLoading(true);
        const res = await login(formData);

        if (res.isSuccess) {
            locationContext.setPathname(FRIENDS_ROUTE)
        } else {
            setNotificationInfo({
                ...notificationInfo,
                isShown: true,
                title: 'Oops!',
                message: res.message
            });
        }
        setIsLoading(false);
    }

    const onValidSignupFormSubmit = async (formData) => {
        setIsLoading(true);
        const res = await signUp(formData);

        if (res.isSuccess) {
            locationContext.setPathname(FRIENDS_ROUTE)
        } else {
            setNotificationInfo({
                ...notificationInfo,
                isShown: true,
                title: 'Oops!',
                message: res.message
            });
        }
        setIsLoading(false);
    }

    const imports = [SignUpForm, LoginForm, InputText, InputPassword, Button, Loader, Notification];

    const template = `
    <div>
        <div class={containerClass}>
            <div class="auth__tabs">
                <Button 
                    classes="auth__tab {loginTabClass}" 
                    onClick={setLogin} 
                    content="Log in" />
                <Button 
                    classes="auth__tab {signupTabClass}" 
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
        </div>
        <Notification 
            isShown={notificationInfo.isShown} 
            title={notificationInfo.title}
            message={notificationInfo.message} 
            status={notificationInfo.status} 
            onExit={handleNotificationExit}/>    
    </div>`;

    const attach = {
        isLogin,
        isLoading,
        notificationInfo,
        onValidLoginFormSubmit,
        onValidSignupFormSubmit,
        loginTabClass: isLogin ? 'active' : '',
        signupTabClass: isLogin ? '' : 'active',
        containerClass: isLoading ? 'auth__container-loading' : 'auth__container',
        setLogin: () => locationContext.setPathname('/login'),
        setSignUp: () => locationContext.setPathname('/signup'),
        handleNotificationExit: () => setNotificationInfo({...notificationInfo, isShown: false}),
    };

    return {imports, template, attach};
}
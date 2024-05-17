import {InputText} from "./ui/InputText.js";
import {Serianilla} from "../../framework/Serianilla.js";
import {InputPassword} from "./ui/InputPassword.js";
import {Button} from "./ui/Button.js";
import {validateEmail, validatePassword, validateRepeatPassword, validateUsername} from "../validation/auth.js";

export const LoginForm = ({onValidSubmit}) => {
    const [usernameInfo, setUsernameInfo] = Serianilla.useState({value: '', validated: false, errorMessage: ''});
    const [emailInfo, setEmailInfo] = Serianilla.useState({value: '', validated: false, errorMessage: ''});
    const [passwordInfo, setPasswordInfo] = Serianilla.useState({value: '', validated: false, errorMessage: ''});
    const [repeatPasswordInfo, setRepeatPasswordInfo] = Serianilla.useState({value: '', validated: false, errorMessage: ''});

    const handleSubmit = e => {
        e.preventDefault();

        let errorMessage, allValid = true;

        errorMessage = validateUsername(usernameInfo.value);
        allValid = allValid ? errorMessage === '' : false;
        setUsernameInfo({...usernameInfo, validated: true, errorMessage});

        errorMessage = validateEmail(emailInfo.value);
        allValid = allValid ? errorMessage === '' : false;
        setEmailInfo({...emailInfo, validated: true, errorMessage});

        errorMessage = validatePassword(passwordInfo.value);
        allValid = allValid ? errorMessage === '' : false;
        setPasswordInfo({...passwordInfo, validated: true, errorMessage});

        errorMessage = validateRepeatPassword(passwordInfo.value, repeatPasswordInfo.value);
        allValid = allValid ? errorMessage === '' : false;
        setRepeatPasswordInfo({...repeatPasswordInfo, validated: true, errorMessage});

        if (!allValid) {
            return;
        }

        const formData = new FormData();

        formData.append('username', usernameInfo.value);
        formData.append('email', emailInfo.value);
        formData.append('password', passwordInfo.value);
        formData.append('repeat-password', repeatPasswordInfo.value);

        onValidSubmit(formData);
    }

    const imports = {Button, InputText, InputPassword};

    const template = `
    <form onSubmit={handleSubmit}>
        <InputText 
            id="login_username"
            name="name"
            placeholder="Username"
            label="Create a username"
            autocomplete="username"
            onChange={onUsernameChanged}
            value={usernameInfo.value}
            isValidated={usernameInfo.validated}
            errorMessage={usernameInfo.errorMessage} />
        
        <InputText 
            id="login_email"
            name="email"
            placeholder="Email"
            label="Enter your email address"
            autocomplete="email"
            onChange={onEmailChanged}
            value={emailInfo.value}
            isValidated={emailInfo.validated}
            errorMessage={emailInfo.errorMessage} />   
        
        <InputPassword 
            id="login_password"
            placeholder="Password"
            label="Create a strong password"
            autocomplete="new-password"
            onChange={onPasswordChanged}
            value={passwordInfo.value}
            isValidated={passwordInfo.validated}
            errorMessage={passwordInfo.errorMessage} />
        
        <InputPassword 
            id="login_repeat-password"
            placeholder="Password"
            label="Repeat the password"
            autocomplete="new-password"
            onChange={onRepeatPasswordChanged}
            value={repeatPasswordInfo.value}
            isValidated={repeatPasswordInfo.validated}
            errorMessage={repeatPasswordInfo.errorMessage} /> 
        
        <Button classes="auth__submit-btn" type="submit" content="Submit"/>
    </form>`;

    const attach = {
        handleSubmit,
        usernameInfo,
        emailInfo,
        passwordInfo,
        repeatPasswordInfo,
        onUsernameChanged: value => setUsernameInfo({value, validated: false, errorMessage: ''}),
        onEmailChanged: value => setEmailInfo({value, validated: false, errorMessage: ''}),
        onPasswordChanged: value => setPasswordInfo({value, validated: false, errorMessage: ''}),
        onRepeatPasswordChanged: value => setRepeatPasswordInfo({value, validated: false, errorMessage: ''}),
    };

    return {imports, template, attach};
}
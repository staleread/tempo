import {InputText} from "./ui/InputText.js";
import {Serianilla} from "../../framework/Serianilla.js";
import {InputPassword} from "./ui/InputPassword.js";
import {Button} from "./ui/Button.js";
import {validateFormData} from "../validation/auth.js";

export const SignUpForm = ({onValidSubmit}) => {
    const [usernameInfo, setUsernameInfo] = Serianilla.useState({value: '', isValidated: false, errorMessage: ''});
    const [emailInfo, setEmailInfo] = Serianilla.useState({value: '', isValidated: false, errorMessage: ''});
    const [passwordInfo, setPasswordInfo] = Serianilla.useState({value: '', isValidated: false, errorMessage: ''});
    const [repeatPasswordInfo, setRepeatPasswordInfo] = Serianilla.useState({value: '', isValidated: false, errorMessage: ''});

    const updateCallbackMap = new Map([
        ['username', setUsernameInfo],
        ['email', setEmailInfo],
        ['password', setPasswordInfo],
        ['repeat-password', setRepeatPasswordInfo],
    ])

    const handleSubmit = e => {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);
        const validationEntries = validateFormData(formData);

        for (const [key, value, errorMessage] of validationEntries) {
            const updateCallback = updateCallbackMap.get(key);
            updateCallback({value, isValidated: true, errorMessage});
        }

        if (validationEntries.map(e => e[1]).some(err => err !== '')) {
            return;
        }
        onValidSubmit(formData);
    }

    const imports = [Button, InputText, InputPassword];

    const template = `
    <form onSubmit={handleSubmit}>
        <InputText 
            id="login_username"
            name="username"
            placeholder="Username"
            label="Create a username"
            autocomplete="username"
            onChange={onUsernameChanged}
            value={usernameInfo.value}
            isValidated={usernameInfo.isValidated}
            errorMessage={usernameInfo.errorMessage} />
        
        <InputText 
            id="login_email"
            name="email"
            placeholder="Email"
            label="Enter your email address"
            autocomplete="email"
            onChange={onEmailChanged}
            value={emailInfo.value}
            isValidated={emailInfo.isValidated}
            errorMessage={emailInfo.errorMessage} />   
        
        <InputPassword 
            id="login_password"
            placeholder="Password"
            name="password"
            label="Create a strong password"
            autocomplete="new-password"
            onChange={onPasswordChanged}
            value={passwordInfo.value}
            isValidated={passwordInfo.isValidated}
            errorMessage={passwordInfo.errorMessage} />
        
        <InputPassword 
            id="login_repeat-password"
            placeholder="Password"
            name="repeat-password"
            label="Repeat the password"
            autocomplete="new-password"
            onChange={onRepeatPasswordChanged}
            value={repeatPasswordInfo.value}
            isValidated={repeatPasswordInfo.isValidated}
            errorMessage={repeatPasswordInfo.errorMessage} /> 
        
        <Button classes="auth__submit-btn" type="submit" content="Submit"/>
    </form>`;

    const attach = {
        handleSubmit,
        usernameInfo,
        emailInfo,
        passwordInfo,
        repeatPasswordInfo,
        onUsernameChanged: value => {
            usernameInfo.value
            setUsernameInfo({value, isValidated: false, errorMessage: ''})
        },
        onEmailChanged: value => setEmailInfo({value, isValidated: false, errorMessage: ''}),
        onPasswordChanged: value => setPasswordInfo({value, isValidated: false, errorMessage: ''}),
        onRepeatPasswordChanged: value => setRepeatPasswordInfo({value, isValidated: false, errorMessage: ''}),
    };

    return {imports, template, attach};
}
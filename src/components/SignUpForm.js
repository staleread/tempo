import {InputText} from "./ui/InputText.js";
import {Serianilla} from "../../framework/Serianilla.js";
import {InputPassword} from "./ui/InputPassword.js";
import {Button} from "./ui/Button.js";
import {validateFormData} from "../validation/auth.js";

export const SignUpForm = ({onValidSubmit}) => {
    const [usernameInfo, setUsernameInfo] = Serianilla.useState({value: '', validated: false, errorMessage: ''});
    const [emailInfo, setEmailInfo] = Serianilla.useState({value: '', validated: false, errorMessage: ''});
    const [passwordInfo, setPasswordInfo] = Serianilla.useState({value: '', validated: false, errorMessage: ''});
    const [repeatPasswordInfo, setRepeatPasswordInfo] = Serianilla.useState({value: '', validated: false, errorMessage: ''});

    const updateValidationStatusMap = new Map([
        ['username', errorMessage => setUsernameInfo({...usernameInfo, isValidated: true, errorMessage})],
        ['email', errorMessage => setEmailInfo({...emailInfo, isValidated: true, errorMessage})],
        ['password', errorMessage => setPasswordInfo({...passwordInfo, isValidated: true, errorMessage})],
        ['repeat-password', errorMessage => setRepeatPasswordInfo({...repeatPasswordInfo, isValidated: true, errorMessage})],
    ])

    const handleSubmit = e => {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);
        const errorEntries = validateFormData(formData);

        for (const [key, errorMessage] of errorEntries) {
            updateValidationStatusMap.get(key)(errorMessage);
        }

        if (errorEntries.map(e => e[1]).some(err => err !== '')) {
            return;
        }
        onValidSubmit(formData);
    }

    const imports = [Button, InputText, InputPassword];

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
        onUsernameChanged: value => setUsernameInfo({value, isValidated: false, errorMessage: ''}),
        onEmailChanged: value => setEmailInfo({value, isValidated: false, errorMessage: ''}),
        onPasswordChanged: value => setPasswordInfo({value, isValidated: false, errorMessage: ''}),
        onRepeatPasswordChanged: value => setRepeatPasswordInfo({value, isValidated: false, errorMessage: ''}),
    };

    return {imports, template, attach};
}
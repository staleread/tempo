import {InputText} from "./ui/InputText.js";
import {Serianilla} from "../../framework/Serianilla.js";
import {InputPassword} from "./ui/InputPassword.js";
import {Button} from "./ui/Button.js";
import {validateFormData} from "../validation/auth.js";

export const LoginForm = ({onValidSubmit}) => {
    const [usernameInfo, setUsernameInfo] = Serianilla.useState({value: '', isValidated: false, errorMessage: ''});
    const [passwordInfo, setPasswordInfo] = Serianilla.useState({value: '', isValidated: false, errorMessage: ''});

    const updateCallbackMap = new Map([
        ['username', setUsernameInfo],
        ['password', setPasswordInfo],
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

        if (validationEntries.map(e => e[2]).some(err => err !== '')) {
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
        
        <InputPassword 
            id="signup_password"
            name="password"
            placeholder="Password"
            label="Enter your password"
            autocomplete="curent-password"
            onChange={onPasswordChanged}
            value={passwordInfo.value}
            isValidated={passwordInfo.isValidated}
            errorMessage={passwordInfo.errorMessage}  />
        
        <Button classes="auth__submit-btn" type="submit" content="Submit"/>
    </form>`;

    const attach = {
        handleSubmit,
        usernameInfo,
        passwordInfo,
        onUsernameChanged: value => setUsernameInfo({value, isValidated: false, errorMessage: ''}),
        onPasswordChanged: value => setPasswordInfo({value, isValidated: false, errorMessage: ''}),
    };

    return {imports, template, attach};
}
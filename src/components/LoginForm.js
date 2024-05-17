import {InputText} from "./ui/InputText.js";
import {Serianilla} from "../../framework/Serianilla.js";
import {InputPassword} from "./ui/InputPassword.js";
import {Button} from "./ui/Button.js";
import {validatePassword, validateUsername} from "../validation/auth.js";

export const LoginForm = ({onValidSubmit}) => {
    const [usernameInfo, setUsernameInfo] = Serianilla.useState({value: '', validated: false, errorMessage: ''});
    const [passwordInfo, setPasswordInfo] = Serianilla.useState({value: '', validated: false, errorMessage: ''});

    const handleSubmit = e => {
        e.preventDefault();

        let errorMessage, allValid = true;

        errorMessage = validateUsername(usernameInfo.value);
        allValid = allValid ? errorMessage === '' : false;
        setUsernameInfo({...usernameInfo, validated: true, errorMessage})

        errorMessage = validatePassword(passwordInfo.value);
        allValid = allValid ? errorMessage === '' : false;
        setPasswordInfo({...passwordInfo, validated: true, errorMessage})

        if (!allValid) {
            return;
        }

        const formData = new FormData();

        formData.append('username', usernameInfo.value);
        formData.append('password', passwordInfo.value);

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
        
        <InputPassword 
            id="signup_password"
            placeholder="Password"
            label="Enter your password"
            autocomplete="curent-password"
            onChange={onPasswordChanged}
            value={passwordInfo.value}
            isValidated={passwordInfo.validated}
            errorMessage={passwordInfo.errorMessage}  />
        
        <Button classes="auth__submit-btn" type="submit" content="Submit"/>
    </form>`;

    const attach = {
        handleSubmit,
        usernameInfo,
        passwordInfo,
        onUsernameChanged: value => setUsernameInfo({value, validated: false, errorMessage: ''}),
        onPasswordChanged: value => setPasswordInfo({value, validated: false, errorMessage: ''}),
    };

    return {imports, template, attach};
}
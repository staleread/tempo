import {InputText} from "./ui/InputText.js";
import {Serianilla} from "../../framework/Serianilla.js";
import {InputPassword} from "./ui/InputPassword.js";
import {Button} from "./ui/Button.js";

export const SignUpForm = ({onValidSubmit}) => {
    const [usernameInfo, setUsernameInfo] = Serianilla.useState({value: '', errorMessage: ''});
    const [passwordInfo, setPasswordInfo] = Serianilla.useState({value: '', errorMessage: ''});

    const handleSubmit = e => {
        e.preventDefault();

        const formData = new FormData();

        formData.append('username', usernameInfo.value);
        formData.append('password', passwordInfo.value);

        // some logic...

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
            errorMessage={usernameInfo.errorMessage} />
        
        <InputPassword 
            id="signup_password"
            placeholder="Password"
            label="Enter your password"
            autocomplete="curent-password"
            onChange={onPasswordChanged}
            value={passwordInfo.value}
            errorMessage={passwordInfo.errorMessage}  />
        
        <Button classes="auth__submit-btn" type="submit" content="Submit"/>
    </form>`;

    const attach = {
        handleSubmit,
        usernameInfo,
        passwordInfo,
        onUsernameChanged: value => setUsernameInfo({...usernameInfo, value}),
        onPasswordChanged: value => setPasswordInfo({...passwordInfo, value}),
    };

    return {imports, template, attach};
}
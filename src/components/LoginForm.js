import {InputText} from "./ui/InputText.js";
import {Serianilla} from "../../framework/Serianilla.js";
import {InputPassword} from "./ui/InputPassword.js";
import {Button} from "./ui/Button.js";

export const LoginForm = ({onValidSubmit}) => {
    const [usernameInfo, setUsernameInfo] = Serianilla.useState({value: '', errorMessage: ''});
    const [emailInfo, setEmailInfo] = Serianilla.useState({value: '', errorMessage: ''});
    const [passwordInfo, setPasswordInfo] = Serianilla.useState({value: '', errorMessage: ''});
    const [repeatPasswordInfo, setRepeatPasswordInfo] = Serianilla.useState({value: '', errorMessage: ''});

    const handleSubmit = e => {
        e.preventDefault();

        const formData = new FormData();

        formData.append('username', usernameInfo.value);
        formData.append('email', emailInfo.value);
        formData.append('password', passwordInfo.value);
        formData.append('repeat-password', repeatPasswordInfo.value);

        console.log(formData)

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
        
        <InputText 
            id="login_email"
            name="email"
            placeholder="Email"
            label="Enter your email address"
            autocomplete="email"
            onChange={onEmailChanged}
            value={emailInfo.value}
            errorMessage={emailInfo.errorMessage} />   
        
        <InputPassword 
            id="login_password"
            placeholder="Password"
            label="Create a strong password"
            autocomplete="new-password"
            onChange={onPasswordChanged}
            value={passwordInfo.value}
            errorMessage={passwordInfo.errorMessage} />
        
        <InputPassword 
            id="login_repeat-password"
            placeholder="Password"
            label="Repeat the password"
            autocomplete="new-password"
            onChange={onRepeatPasswordChanged}
            value={repeatPasswordInfo.value}
            errorMessage={repeatPasswordInfo.errorMessage} /> 
        
        <Button classes="auth__submit-btn" type="submit" content="Submit"/>
    </form>`;

    const attach = {
        handleSubmit,
        usernameInfo,
        emailInfo,
        passwordInfo,
        repeatPasswordInfo,
        onUsernameChanged: value => setUsernameInfo({...usernameInfo, value}),
        onEmailChanged: value => setEmailInfo({...emailInfo, value}),
        onPasswordChanged: value => setPasswordInfo({...passwordInfo, value}),
        onRepeatPasswordChanged: value => setRepeatPasswordInfo({...repeatPasswordInfo, value}),
    };

    return {imports, template, attach};
}
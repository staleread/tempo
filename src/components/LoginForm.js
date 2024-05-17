import {InputText} from "./ui/InputText.js";
import {Serianilla} from "../../framework/Serianilla.js";
import {InputPassword} from "./ui/InputPassword.js";
import {Button} from "./ui/Button.js";

export const LoginForm = ({onValidSubmit}) => {
    const [formInfo, setFormInfo] = Serianilla.useState({
        username: '',
        email: '',
        password: '',
        repeatPassword: '',
    });

    const handleSubmit = e => {
        e.preventDefault();

        const formData = new FormData();

        for (const [key, value] of Object.entries(formInfo)) {
            formData.append(key, value.toString());
        }

        // some logic...

        onValidSubmit();
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
            data={usernameInputData} />
        
        <InputText 
            id="login_email"
            name="email"
            placeholder="Email"
            label="Enter your email address"
            autocomplete="email"
            onChange={onEmailChanged}
            data={emailInputData} />   
        
        <InputPassword 
            id="login_password"
            placeholder="Password"
            label="Create a strong password"
            autocomplete="new-password"
            onChange={onPasswordChanged}
            data={passwordInputData} />
        
        <InputPassword 
            id="login_repeat-password"
            placeholder="Password"
            label="Repeat the password"
            autocomplete="new-password"
            onChange={onRepeatPasswordChanged}
            data={repeatPasswordInputData} /> 
        
        <Button classes="auth__submit-btn" type="submit" content="Submit"/>
    </form>`;

    const attach = {
        handleSubmit,
        onUsernameChanged: (username) => setFormInfo({...formInfo, username}),
        onEmailChanged: (email) => setFormInfo({...formInfo, email}),
        onPasswordChanged: (password) => setFormInfo({...formInfo, password}),
        onRepeatPasswordChanged: (repeatPassword) => setFormInfo({...formInfo, repeatPassword}),
        usernameInputData: {
            errorMessage: '',
            required: true,
            value: formInfo.username,
        },
        emailInputData: {
            errorMessage: '',
            required: true,
            value: formInfo.email,
        },
        passwordInputData: {
            errorMessage: '',
            required: true,
            value: formInfo.password,
        },
        repeatPasswordInputData: {
            errorMessage: '',
            required: true,
            value: formInfo.repeatPassword,
        },
    };

    return {imports, template, attach};
}
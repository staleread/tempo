import {InputText} from "./ui/InputText.js";
import {Serianilla} from "../../framework/Serianilla.js";
import {InputPassword} from "./ui/InputPassword.js";
import {Button} from "./ui/Button.js";

export const SignUpForm = ({onValidSubmit}) => {
    const [formInfo, setFormInfo] = Serianilla.useState({
        username: '',
        password: '',
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
            id="signup_username"
            name="name"
            placeholder="Username"
            label="Enter your username"
            autocomplete="username"
            onChange={onUsernameChanged}
            data={usernameInputData} />
        
        <InputPassword 
            id="signup_password"
            placeholder="Password"
            label="Enter your password"
            autocomplete="curent-password"
            onChange={onPasswordChanged}
            data={passwordInputData} />
        
        <Button classes="auth__submit-btn" type="submit" content="Submit"/>
    </form>`;

    const attach = {
        handleSubmit,
        onUsernameChanged: (username) => setFormInfo({...formInfo, username}),
        onPasswordChanged: (password) => setFormInfo({...formInfo, password}),
        usernameInputData: {
            errorMessage: '',
            required: true,
            value: formInfo.username,
        },
        passwordInputData: {
            errorMessage: '',
            required: true,
            value: formInfo.password,
        },
    };

    return {imports, template, attach};
}
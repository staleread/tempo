import {InputText} from "./ui/InputText.js";
import {Serianilla} from "../../framework/Serianilla.js";
import {InputPassword} from "./ui/InputPassword.js";

export const LoginForm = () => {
    const [formInfo, setFormInfo] = Serianilla.useState({
        username: '',
        email: '',
        password: '',
        repeatPassword: '',
    });

    const handleSubmit = e => {
        e.preventDefault();

        const formData = new FormData();
        console.log(Object.entries(formInfo))

        for (const [key, value] of Object.entries(formInfo)) {
            formData.append(key, value.toString());
        }
        console.log(formData);
    }

    const imports = {InputText, InputPassword};

    const template = `
    <form onSubmit={handleSubmit} style="height: 250px; width: 200px; background-color: yellow">
        <InputText data={usernameInputData} />
        <InputText data={emailInputData} />
        <InputPassword data={passwordInputData} />
        <InputPassword data={repeatPasswordInputData} />
        
        <button type="submit">Submit</button>
    </form>`;

    const attach = {
        handleSubmit: e => {
            e.preventDefault();

            const formData = new FormData();
            console.log(Object.entries(formInfo))

            for (const [key, value] of Object.entries(formInfo)) {
                formData.append(key, value.toString());
            }
            console.log(formData);
        },
        usernameInputData: {
            id: 'login_username',
            name: 'name',
            placeholder: 'Username',
            label: 'Create a username',
            autocomplete: 'username',
            errorMessage: '',
            required: true,
            value: formInfo.username,
            onChange: (username) => setFormInfo({...formInfo, username}),
        },
        emailInputData: {
            id: 'login_email',
            name: 'email',
            placeholder: 'Email',
            label: "Enter your email",
            autocomplete: "email",
            errorMessage: '',
            required: true,
            value: formInfo.email,
            onChange: (email) => setFormInfo({...formInfo, email})
        },
        passwordInputData: {
            id: 'login_password',
            name: 'password',
            placeholder: 'Password',
            label: 'Create a strong password',
            errorMessage: '',
            autocomplete: 'new-password',
            required: true,
            value: formInfo.password,
            onChange: (password) => setFormInfo({...formInfo, password})
        },
        repeatPasswordInputData: {
            id: 'login_repeat-password',
            name: 'password',
            placeholder: 'Password',
            label: 'Repeat the password',
            errorMessage: '',
            autocomplete: 'new-password',
            required: true,
            value: formInfo.repeatPassword,
            onChange: (repeatPassword) => setFormInfo({...formInfo, repeatPassword})
        }
    };

    return {imports, template, attach};
}
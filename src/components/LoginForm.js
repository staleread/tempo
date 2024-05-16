import {InputText} from "./ui/InputText.js";
import {Serianilla} from "../../framework/Serianilla.js";
import {InputPassword} from "./ui/InputPassword.js";

export const LoginForm = () => {
    const [formData, setFormData] = Serianilla.useState({
        username: '',
        email: '',
        password: '',
        repeatPassword: '',
    });

    const imports = {InputText, InputPassword};

    const template = `
    <form style="height: 200px; width: 200px; background-color: yellow">
        <InputText 
            id="login_username"
            name="name"
            placeholder="Username"
            label="Create a username"
            autocomplete="username"
            errorMessage=""
            required={isRequired}
            value={username}
            onChange={onUsernameChanged}
        />
        
        <InputText 
            id="login_email"
            name="email"
            placeholder="Email"
            label="Enter your email"
            autocomplete="email"
            errorMessage=""
            value={email}
            required={isRequired}
            onChange={onEmailChanged}
        />
        
        <InputPassword 
            id="login_password"
            name="password"
            placeholder="Password"
            label="Create a strong password"
            errorMessage=""
            autocomplete="new-password"
            value={password}
            required={isRequired}
            onChange={onPasswordChanged}
        />
        
        <InputPassword 
            id="login_repeat-password"
            name="password"
            placeholder="Password"
            label="Repeat the password"
            errorMessage=""
            autocomplete="new-password"
            value={repeatPassword}
            required={isRequired}
            onChange={onRepeatPasswordChanged}
        />
        
        <button type="submit" onSubmit={handleSubmit}>Submit</button>
    </form>`;

    const attach = {
        ...formData,
        isRequired: true,
        onUsernameChanged: (username) => setFormData({...formData, username: username}),
        onEmailChanged: (email) => setFormData({...formData, email: email}),
        onPasswordChanged: (password) => setFormData({...formData, password: password}),
        onRepeatPasswordChanged: (repeatPassword) => setFormData({...formData, repeatPassword: repeatPassword}),
        handleSubmit: () => {
            const formData = new FormData;

            formData.set('username', formData.username);
            console.log(formData)
        }
    };

    return {imports, template, attach};
}
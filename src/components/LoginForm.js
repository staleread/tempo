import {TextInput} from "./ui/TextInput.js";

export const LoginForm = () => {
    const attach = {
        isRequired: true,
        handleUsernameChanged: (text) => {
            console.log('Username is ' + text)
        }
    }

    return {
        attach,
        imports: {TextInput},
        template: `
        <form style="height: 200px; width: 200px; background-color: yellow">
            <TextInput 
                id="login_username"
                name="name"
                placeholder="Username"
                label="Create a username"
                required={isRequired}
                onChange={handleUsernameChanged}
                errorMessage="Something went wrong"
            />
            
            <label for="login_email">Enter your email</label>
            <input type="email" name="email" id="login_email" required/>
            
            <label for="login_password">Create a password</label>
            <input type="password" name="password" id="login_password" required/>
            
            <label for="login_repeat-password">Repeat the password</label>
            <input type="password" name="password" id="login_repeat-password" required/>
            
            <button type="submit">Submit</button>
        </form>`
    }
}
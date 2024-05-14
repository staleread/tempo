export const SignUpForm = () => {
    const imports = {};

    const template = `
    <form style="height: 200px; width: 200px; background-color: yellow">
        <label for="login_username">Enter Username</label>
        <input type="text" name="name" id="login_username" required/>
        
        <label for="login_password">Enter your password</label>
        <input type="password" name="password" id="login_password" required/>
        
        <button type="submit">Submit</button>
    </form>`;

    const attach = {};

    return {imports, template, attach};
}
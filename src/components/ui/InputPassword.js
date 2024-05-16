import {Serianilla} from "../../../framework/Serianilla.js";

export const InputPassword = ({data, id, placeholder, label, onChange}) => {
    const [type, setType] = Serianilla.useState('password')
    const imports = {};

    const template = `
    <div class="auth__form-div">
        <label class="auth__label" for="${id}">${label ?? ''}</label>
        <div>
            <input
                id="${id}"
                type="${type}"
                name="password"
                placeholder="${placeholder ?? ''}"
                ${data.required ? 'required' : ''}
                value="${data.value}"
                autocomplete="new-password"
                onChange={onChange}
            />
            <button type="button" onClick={switchMode}>Eye</button>
        </div>
        <div class="error-message">${data.errorMessage}</div>
    </div>`;

    const attach = {
        onChange: (e) => {
            const text = e.target.value;
            onChange(text);
        },
        switchMode: () => setType(type === 'password' ? 'text' : 'password'),
    };

    return {imports, template, attach, hasDynamicInterpolation: true};
}
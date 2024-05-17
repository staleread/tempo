import {Serianilla} from "../../../framework/Serianilla.js";

export const InputPassword = ({data, id, placeholder, label, onChange}) => {
    const [type, setType] = Serianilla.useState('password')
    const imports = {};

    const template = `
    <div class="auth__form-div">
        <label class="auth__label" for="${id}">${label ?? ''}</label>
        <div class="input-container auth__input-container">
            <input
                class="input-base auth__password"
                id="${id}"
                type="${type}"
                name="password"
                placeholder="${placeholder ?? ''}"
                ${data.required ? 'required' : ''}
                value="${data.value}"
                autocomplete="new-password"
                onChange={onChange} />
            <button class="button-base auth__switch-mode-button ${type === 'password' ? 'closed-eye' : 'opened-eye'}" type="button" onClick={switchMode}></button>
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
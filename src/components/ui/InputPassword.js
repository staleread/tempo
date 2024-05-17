import {Serianilla} from "../../../framework/Serianilla.js";

export const InputPassword = ({data, id, placeholder, label, autocomplete, onChange, onInput}) => {
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
                ${autocomplete ? `autocomplete="${autocomplete}"` : ''}
                ${onChange ? 'onChange={handleChange}' : ''}
                ${onInput ? 'onInput={handleInput}' : ''} />
            <button 
                class="button-base auth__switch-mode-button ${type === 'password' ? 'closed-eye' : 'opened-eye'}" 
                type="button" 
                tabindex="-1"
                onClick={switchMode}
            ></button>
        </div>
        <div class="error-message">${data.errorMessage}</div>
    </div>`;

    const attach = {
        handleChange: e => {
            const text = e.target.value;
            onChange?.(text);
        },
        handleInput: e => {
            const text = e.target.value;
            onInput?.(text);
        },
        switchMode: () => setType(type === 'password' ? 'text' : 'password'),
    };

    return {imports, template, attach, hasDynamicInterpolation: true};
}
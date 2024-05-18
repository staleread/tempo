import {Serianilla} from "../../../framework/Serianilla.js";

export const InputPassword = (props) => {
    const [type, setType] = Serianilla.useState('password');

    const validationClass = props.isValidated
        ? props.errorMessage ? 'auth__invalid_container' : 'auth__valid_container'
        : '';

    const template = `
    <div class="auth__form-div">
        <label class="auth__label" for="${props.id}">${props.label ?? ''}</label>
        <div class="input-container auth__input-container ${validationClass}">
            <input
                class="input-base auth__password"
                id="${props.id}"
                type="${type}"
                name="password"
                placeholder="${props.placeholder ?? ''}"
                value="${props.value}"
                ${props.autocomplete ? `autocomplete="${props.autocomplete}"` : ''}
                ${props.onChange ? 'onChange={handleChange}' : ''}
                ${props.onInput ? 'onInput={handleInput}' : ''} />
            <button 
                class="button-base auth__switch-mode-button ${type === 'password' ? 'closed-eye' : 'opened-eye'}" 
                type="button" 
                tabindex="-1"
                onClick={switchMode}
            ></button>
        </div>
        <small class="auth__error-message">${props.errorMessage ?? ''}</small>
    </div>`;

    const attach = {
        handleChange: e => {
            const text = e.target.value;
            props.onChange?.(text);
        },
        handleInput: e => {
            const text = e.target.value;
            props.onInput?.(text);
        },
        switchMode: () => setType(type === 'password' ? 'text' : 'password'),
    };

    return {template, attach, hasDynamicInterpolation: true};
}
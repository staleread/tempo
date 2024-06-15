import {Serianilla} from "../../../framework/Serianilla.js";

export const InputPassword = (props) => {
    const [type, setType] = Serianilla.useState('password');

    const handleChange = e => {
        const text = e.target.value;
        props.onChange(text);
    }

    const handleInput = e => {
        const text = e.target.value;
        props.onInput(text);
    }

    const template = `
    <div class="auth__form-div">
        <label class="auth__label" for={props.id}>{props.label}</label>
        <div class="input-container auth__input-container {validationClass}">
            <input
                class="input-base auth__password"
                id={props.id}
                type={type}
                name={props.name}
                placeholder={props.placeholder}
                value={props.value}
                autocomplete={props.autocomplete}
                onChange={handleChange}
                onInput={handleInput} />
            <button 
                class="button-base auth__switch-mode-button {modeClass}" 
                type="button" 
                tabindex="-1"
                onClick={switchMode}
            ></button>
        </div>
        <small class="auth__error-message">{errorMessage}</small>
    </div>`;

    const attach = {
        props,
        type,
        validationClass: props.isValidated
            ? props.errorMessage ? 'auth__invalid_container' : 'auth__valid_container'
            : '',
        modeClass: type === 'password' ? 'closed-eye' : 'opened-eye',
        handleChange: props.onChange ? handleChange : null,
        handleInput: props.onInput ? handleInput : null,
        errorMessage: props.isValidated ? props.errorMessage : '',
        switchMode: () => setType(type === 'password' ? 'text' : 'password'),
    };

    return {template, attach};
}
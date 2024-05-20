export const InputText = (props) => {
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
        <input
            class="input-base auth__input {validationClass}"
            type="text"
            name={props.name}
            id={props.id}
            placeholder={props.placeholder}
            value={props.value}
            autocomplete={props.autocomplete}
            onChange={handleChange}
            onInput={handleInput} />
        <small class="auth__error-message">{errorMessage}</small>
    </div>`;

    const attach = {
        props,
        validationClass: props.isValidated
            ? props.errorMessage ? 'auth__invalid' : 'auth__valid'
            : '',
        handleChange: props.onChange ? handleChange : null,
        handleInput: props.onInput ? handleInput : null,
        errorMessage: props.isValidated ? props.errorMessage : '',
    };

    return {template, attach};
}
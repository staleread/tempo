export const InputText = (props) => {
    const validationClass = props.isValidated
        ? props.errorMessage ? 'auth__invalid' : 'auth__valid'
        : '';

    const template = `
    <div class="auth__form-div">
        <label class="auth__label" for="${props.id}">${props.label ?? ''}</label>
        <input
            class="input-base auth__input ${validationClass}"
            type="text"
            name="${props.name}"
            id="${props.id}"
            placeholder="${props.placeholder ?? ''}"
            value="${props.value}"
            ${props.autocomplete ? `autocomplete="${props.autocomplete}"` : ''}
            ${props.onChange ? 'onChange={handleChange}' : ''}
            ${props.onInput ? 'onInput={handleInput}' : ''} />
        <small class="auth__error-message">${props.isValidated ? props.errorMessage : ''}</small>
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
    };

    return {template, attach, hasDynamicInterpolation: true};
}
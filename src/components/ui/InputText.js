export const InputText = (props) => {
    const imports = {};

    const template = `
    <div class="auth__form-div">
        <label class="auth__label" for="${props.id}">${props.label ?? ''}</label>
        <input
            class="input-base auth__input"
            type="text"
            name="${props.name}"
            id="${props.id}"
            placeholder="${props.placeholder ?? ''}"
            value="${props.value}"
            ${props.autocomplete ? `autocomplete="${props.autocomplete}"` : ''}
            ${props.onChange ? 'onChange={handleChange}' : ''}
            ${props.onInput ? 'onInput={handleInput}' : ''} />
        <div class="error-message">${props.errorMessage ?? ''}</div>
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

    return {imports, template, attach, hasDynamicInterpolation: true};
}
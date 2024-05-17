export const InputText = ({data, id, name, placeholder, label, autocomplete, onChange, onInput}) => {
    const imports = {};

    const template = `
    <div class="auth__form-div">
        <label class="auth__label" for="${id}">${label ?? ''}</label>
        <input
            class="input-base auth__input"
            type="text"
            name="${name}"
            id="${id}"
            placeholder="${placeholder ?? ''}"
            ${data.required ? 'required' : ''}
            value="${data.value}"
            autocomplete="${autocomplete ?? ''}"
            ${onChange ? 'onChange={handleChange}' : ''}
            ${onInput ? 'onInput={handleInput}' : ''} />
        />
        <div class="error-message">${data.errorMessage ?? ''}</div>
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
    };

    return {imports, template, attach, hasDynamicInterpolation: true};
}
export const InputText = ({data, id, name, placeholder, label, autocomplete, onChange}) => {
    const imports = {};

    const template = `
    <div class="auth__form-div">
        <label class="auth__label" for="${id}">${label ?? ''}</label>
        <input
            type="text"
            name="${name}"
            id="${id}"
            placeholder="${placeholder ?? ''}"
            ${data.required ? 'required' : ''}
            value="${data.value}"
            autocomplete="${autocomplete ?? ''}"
            onChange={onChange}
        />
        <div class="error-message">${data.errorMessage ?? ''}</div>
    </div>`;

    const attach = {
        onChange: (e) => {
            const text = e.target.value;
            onChange?.(text);
        }
    };

    return {imports, template, attach, hasDynamicInterpolation: true};
}
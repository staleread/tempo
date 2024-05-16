export const InputText = ({data}) => {
    const imports = {};

    const template = `
    <div>
        <label for={id}>${data.label}</label>
        <input
            type="text"
            name={name}
            id={id}
            placeholder={placeholder}
            ${data.required ? 'required' : ''}
            value={value}
            autocomplete={autocomplete}
            onChange={onChange}
        />
        <$if true={isError}>
            <div class="error-message">${data.errorMessage}</div>
        </$if>
    </div>`;

    const attach = {
        ...data,
        onChange: (e) => {
            const text = e.target.value;
            data.onChange(text);
        },
        isError: !data.errorMessage && data.errorMessage !== '',
    };

    return {imports, template, attach, hasDynamicInterpolation: true};
}
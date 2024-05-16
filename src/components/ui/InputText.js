export const InputText = (props) => {
    const imports = {};

    const template = `
    <div>
        <label for={id}>${props.label}</label>
        <input
            type="text"
            name={name}
            id={id}
            placeholder={placeholder}
            ${props.required ? 'required' : ''}
            value={value}
            autocomplete={autocomplete}
            onChange={onChange}
        />
        <$if true={isError}>
            <div class="error-message">${props.errorMessage}</div>
        </$if>
    </div>`;

    const attach = {
        ...props,
        onChange: (e) => {
            const text = e.target.value;
            props.onChange(text);
        },
        isError: !props.errorMessage && props.errorMessage !== '',
    };

    return {imports, template, attach, hasDynamicInterpolation: true};
}
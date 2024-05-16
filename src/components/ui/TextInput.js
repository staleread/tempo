export const TextInput = (props) => {
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
            onChange={onChange}
        />
        ${props.errorMessage ? `<div class="error-message">${props.errorMessage}</div>` : ''}
    </div>`;

    const attach = {
        ...props,
        onChange: (e) => {
            const text = e.target.value;
            console.log('Text is ' + text);
            props.onChange(text);
        }
    };

    return {imports, template, attach};
}
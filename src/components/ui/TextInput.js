export const TextInput = (props) => {
    console.log(props)
    const attach = {
        props,
        onChange: (e) => {
            const text = e.target.value;
            console.log('Text is ' + text);
            props.onChange(text);
        }
    }

    return {
        attach,
        imports: {},
        template: `
        <div>
            <label for={$props.id}>${props.label}</label>
            <input
                type="text"
                name={$props.name}
                id={$props.id}
                placeholder={$props.placeholder}
                ${props.required ? 'required' : ''}
                onChange={onChange}
            />
            ${props.errorMessage ? `<div class="error-message">${props.errorMessage}</div>` : ''}
        </div>`
    }
}
import {Serianilla} from "../../../framework/Serianilla.js";

export const InputPassword = ({data}) => {
    const [showPassword, setShowPassword] = Serianilla.useState(false)
    const imports = {};

    const template = `
    <div>
        <label for={id}>${data.label}</label>
        <div>
            <input
                type={type}
                name={name}
                id={id}
                placeholder={placeholder}
                ${data.required ? 'required' : ''}
                value={value}
                autocomplete={autocomplete}
                onChange={onChange}
            />
            <button type="button" onClick={handleClick}>Eye</button>
        </div>
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
        type: showPassword ? 'text' : 'password',
        handleClick: () => setShowPassword(!showPassword),
    };

    return {imports, template, attach, hasDynamicInterpolation: true};
}
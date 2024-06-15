export const Button = (props) => {
    const template = `
    <button 
        class="button-base {props.classes}"
        onClick={handleClick}
        disabled={disabled}
        type={props.type}
    >
        {props.content}
    </button>`;

    const attach = {
        props,
        disabled: props.isDisabled ? 'disabled' : null,
        handleClick: props.onClick ? e => props.onClick(e) : null,
    };

    return {template, attach};
}
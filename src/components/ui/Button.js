export const Button = ({data, classes, type, content, onClick}) => {
    const template = `
    <button 
        class="button-base ${classes ? classes : ''}"
        onClick={onClick}
        ${data && data.isDisabled ? 'disabled' : ''}
        ${type ? `type="${type}"` : ''}
    >
        ${content}
    </button>`;

    const attach = {
        onClick: e => onClick?.(e)
    };

    return {template, attach, hasDynamicInterpolation: true};
}
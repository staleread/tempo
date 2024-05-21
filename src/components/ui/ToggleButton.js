export const ToggleButton = ({isOn, classes, onClass, offClass, onToggle}) => {
    const imports = [];

    const template = `
    <button 
        class="button-base {classes} {toggleModeClass}"
        onClick={handleClick}
    ></button>`;

    const attach = {
        classes,
        toggleModeClass: isOn ? onClass : offClass,
        handleClick: () => onToggle?.(!isOn),
    };

    return {imports, template, attach};
}
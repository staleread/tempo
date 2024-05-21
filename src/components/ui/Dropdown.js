import {Serianilla} from "../../../framework/Serianilla.js";

export const Dropdown = ({options, value, onSelect}) => {
    const [isOpen, setIsOpen] = Serianilla.useState(false);

    const selectedOptionName = options.find(o => o.value === value).name;

    const imports = [];

    const template = `
    <div class="app__drop-container">
        <div class="app__drop-options {isOpenClass}">
            <$map items={options} context="option">
                <div class="option-wrapper">
                    <label class="app__drop-option-label" for={option.value}>
                        {option.name}
                    </label>
                    <input 
                        class="app__drop-option-input" 
                        type="radio" 
                        id={option.value} 
                        value={option.value}
                        onChange={handleOptionChange} />                
                </div>
            </$map>        
        </div>
        <button class="app__drop-btn" onClick={toggleIsOpen}>{selectedOptionName}</button>
    </div>`;

    const attach = {
        options,
        selectedOptionName,
        isOpenClass: isOpen ? '' : 'app__drop-hidden',
        toggleIsOpen: () => setIsOpen(!isOpen),
        handleOptionChange: e => {
            const newValue = e.target.value;
            setIsOpen(false);

            if (newValue !== value) {
                onSelect?.(newValue);
            }
        }
    };

    return {imports, template, attach};
}
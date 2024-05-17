export const MessageBox = ({isVisible, title, isSuccess}) => {
    const template = `
    <div class="${isSuccess ? 'app__message-success' : 'app__message-error'} ${!isVisible ? 'app__hidden' : ''}">
        <h3>${title}</h3>
    </div>`;

    return {template, hasDynamicInterpolation: true};
}
import {Auth} from "./pages/Auth.js";
import {Serianilla} from "../framework/Serianilla.js";
import {cssTransitionInOut} from "./utils/transition.js";

export const App = () => {
    const [messageInfo, setMessageInfo] = Serianilla.useState({title: '', success: true});
    const messageRef = Serianilla.useRef(null);

    const imports = [Auth];

    const template = `
    <div>
        <Auth onMessage={onMessage}/>
        <div ref={messageRef} class="${messageInfo.success ? 'app__message-success' : 'app__message-error'}">
            <h3>${messageInfo.title}</h3>
        </div>
    </div>`;

    const attach = {
        messageRef,
        onMessage: ({title, success}) => {
            setMessageInfo({title, success});
            cssTransitionInOut(messageRef, 3000, 'app__message');
        }
    };
    return {imports, template, attach, hasDynamicInterpolation: true};
}
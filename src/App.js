import {Auth} from "./pages/Auth.js";
import {Serianilla} from "../framework/Serianilla.js";
import {MessageBox} from "./components/ui/MessageBox.js";

export const App = () => {
    const [messageInfo, setMessageInfo] = Serianilla.useState(null);

    const imports = {Auth, MessageBox};

    const template = `
    <div>
        <Auth onMessage={onMessage}/>
        <MessageBox isVisible={hasMassage} title={title} isSuccess={success}/>
    </div>`;

    const attach = {
        hasMassage: messageInfo !== null,
        title: messageInfo?.title ?? '',
        success: messageInfo?.success ?? false,
        onMessage: ({title, success}) => {
            setMessageInfo({title, success});
            setTimeout(() => setMessageInfo(null), 3000);
        }
    };

    return {imports, template, attach};
}
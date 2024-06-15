import {Serianilla} from "../../../framework/Serianilla.js";
import {cssTransitionInOut} from "../../utils/transition.js";

export const Notification = (props) => {
    const notificationRef = Serianilla.useRef(null);

    const TIMEOUT = 3000;

    Serianilla.useEffect(() => {
        if (props.isShown) {
            cssTransitionInOut(
                notificationRef,
                TIMEOUT,
                'app__notify',
                props.onExit ? props.onExit : undefined);
        }
    }, [props.isShown]);

    const imports = [];

    const template = `
    <div ref={notificationRef} class="app__notify {statusClass}">
        <h2>{props.title}</h2>
        <p>{props.message}</p>
    </div>`;

    const attach = {
        props,
        notificationRef,
        statusClass: `app__notify_${props.status}`,
    };

    return {imports, template, attach};
}
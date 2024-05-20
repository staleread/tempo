import {Serianilla} from "../../framework/Serianilla.js";
import {Notification} from "./ui/Notification.js";

export const NotificationProvider = ({component, locationContext}) => {
    const [notificationInfo, setNotificationInfo] = Serianilla.useState({
        isShown: false,
        title: '',
        message: '',
        status: 'error'
    });

    const imports = [component, Notification];

    const template = `
        <div>
            <${component.name} locationContext={locationContext} notificationContext={notificationContext} />
            <Notification 
                isShown={notificationInfo.isShown} 
                title={notificationInfo.title}
                message={notificationInfo.message} 
                status={notificationInfo.status} 
                onExit={handleNotificationExit} />   
        </div>`;

    const attach = {
        locationContext,
        component,
        notificationInfo,
        handleNotificationExit: () => setNotificationInfo({...notificationInfo, isShown: false}),
        notificationContext: {
            displayMessage: (title, message, status) => setNotificationInfo({isShown: true, title, message,status}),
        }
    };

    return {imports, template, attach, hasDynamicInterpolation: true};
}
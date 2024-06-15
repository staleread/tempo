import {Serianilla} from "../../framework/Serianilla.js";
import {NotificationProvider} from "./NotificationProvider.js";

export const AppRouter = ({routes, defaultRoute}) => {
    const [route, setRoute] = Serianilla.useState(defaultRoute);
    const query = Serianilla.useRef('');
    const popStateRef = Serianilla.useRef(null);

    const changeQuery = (newQuery) => {
        history.pushState('', '', '?' + newQuery);
        query.current = newQuery;
    }

    const handlePathChanged = (newPath) => {
        const newRoute = routes.find(r => r.path === newPath) ?? routes.at(-1);

        query.current = '';
        setRoute(newRoute);
    }

    const updateRoute = (newPath) => {
        const route = routes.find(r => r.path === newPath) ?? routes.at(-1);
        setRoute(route);
    }

    if (!popStateRef.current) {
        popStateRef.current = {};

        window.addEventListener('popstate', e => {
            updateRoute(location.pathname);
        });
    }

    const imports = [NotificationProvider];

    const template = `<NotificationProvider component={route.component} locationContext={locationContext}/>`;

    const attach = {
        route,
        locationContext: {
            pathname: route.path,
            search: query.current,
            goTo: path => handlePathChanged(path, ''),
            changeQuery,
        },
    };

    return {imports, template, attach};
}
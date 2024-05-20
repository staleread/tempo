import {AppRouter} from "./components/AppRouter.js";
import {LOGIN_ROUTE, publicRoutes} from "./routes.js";

export const App = () => {
    const imports = [AppRouter];

    const template = `
    <div>
        <AppRouter routes={routes} defaultPath={defaultRoute} />
    </div>`

    const attach = {
        routes: publicRoutes,
        defaultRoute: LOGIN_ROUTE,
    }

    return {imports, template, attach};
}
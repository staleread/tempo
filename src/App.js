import {AppRouter} from "./components/AppRouter.js";
import {publicRoutes} from "./routes.js";

export const App = () => {
    const imports = [AppRouter];

    const template = `
    <div>
        <AppRouter routes={routes} defaultRoute={defaultRoute} />
    </div>`

    const attach = {
        routes: publicRoutes,
        defaultRoute: publicRoutes[1],
    }

    return {imports, template, attach};
}
import {AppRouter} from "./components/AppRouter.js";
import {publicRoutes} from "./routes.js";

export const App = () => {
    const imports = [AppRouter];

    const template = `
    <div>
        <AppRouter routes={routes} defaultPath="/" />
    </div>`

    const attach = {
        routes: publicRoutes,
    }

    return {imports, template, attach};
}
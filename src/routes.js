import {Friends} from "./pages/Friends.js";
import {Auth} from "./pages/Auth.js";
import {NotFound} from "./pages/NotFound.js";
import {FRIENDS_ROUTE, LOGIN_ROUTE, NOTFOUND_ROUTE, SIGNUP_ROUTE} from "./utils/consts.js";

export const publicRoutes = [
    {
        path: FRIENDS_ROUTE,
        component: Friends,
    },
    {
        path: LOGIN_ROUTE,
        component: Auth,
    },
    {
        path: SIGNUP_ROUTE,
        component: Auth,
    },
    {
        path: NOTFOUND_ROUTE,
        component: NotFound,
    },
]
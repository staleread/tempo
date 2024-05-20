import {Friends} from "./pages/Friends.js";
import {Auth} from "./pages/Auth.js";
import {NotFound} from "./pages/NotFound.js";

export const FRIENDS_ROUTE = '/friends';
export const LOGIN_ROUTE = '/login';
export const SIGNUP_ROUTE = '/signup';
export const NOTFOUND_ROUTE = '/404';

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
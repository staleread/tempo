import {Friends} from "./pages/Friends.js";
import {Auth} from "./pages/Auth.js";
import {NotFound} from "./pages/NotFound.js";

export const publicRoutes = [
    {
        path: '/',
        component: Friends,
    },
    {
        path: '/friends',
        component: Friends,
    },
    {
        path: '/login',
        component: Auth,
    },
    {
        path: '/signup',
        component: Auth,
    },
    {
        path: '/404',
        component: NotFound,
    },
]
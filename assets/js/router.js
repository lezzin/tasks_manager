import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { db, auth, provider } from "./libs/firebase.js";
import Login from "./components/Login.js";
import Home from "./components/Home.js";
import General from "./components/General.js";
import NotFound from "./components/NotFound.js";
import Kanban from "./components/Kanban.js";

const getCurrentUser = () => {
    return new Promise((resolve, reject) => {
        const removeListener = onAuthStateChanged(
            auth,
            user => {
                removeListener();
                resolve(user);
            },
            reject
        );
    });
}

const routes = [
    {
        path: "/login",
        component: Login,
        props: {
            provider: provider,
            auth: auth,
        },
        meta: {
            requiresAuth: false
        }
    },
    {
        path: "/",
        component: Home,
        props: {
            db: db,
            auth: auth,
        },
        meta: {
            requiresAuth: true
        }
    },
    {
        path: "/topic/:id",
        component: Home,
        props: {
            db: db,
            auth: auth,
        },
        meta: {
            requiresAuth: true
        }
    },
    {
        path: "/general",
        component: General,
        props: {
            db: db,
        },
        meta: {
            requiresAuth: true
        }
    },
    {
        path: "/kanban",
        component: Kanban,
        props: {
            db: db,
        },
        meta: {
            requiresAuth: true
        }
    },
    {
        path: "*",
        component: NotFound,
        meta: {
            requiresAuth: false
        }
    }
];

const router = new VueRouter({ routes });

router.beforeEach(async (to, from, next) => {
    if (to.matched.some(record => record.meta.requiresAuth)) {
        if (await getCurrentUser()) {
            next();
        } else {
            next("/login");
        }
    } else {
        next();
    }
});

export default router;
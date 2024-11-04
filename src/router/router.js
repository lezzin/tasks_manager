import { createRouter, createWebHistory } from "vue-router";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth, provider } from "../libs/firebase.js";

const getCurrentUser = () => {
    return new Promise((resolve, reject) => {
        const removeListener = onAuthStateChanged(
            auth,
            (user) => {
                removeListener();
                resolve(user);
            },
            reject
        );
    });
};

const routes = [
    {
        path: "/login",
        component: () => import('../views/Login.vue'),
        props: {
            provider: provider,
            auth: auth,
        },
        meta: {
            requiresAuth: false,
        },
    },
    {
        path: "/",
        component: () => import('../views/Home.vue'),
        props: { db: db },
        meta: {
            requiresAuth: true,
        },
    },
    {
        path: "/topic/:id",
        component: () => import('../views/Home.vue'),
        props: { db: db },
        meta: {
            requiresAuth: true,
        },
    },
    {
        path: "/general",
        component: () => import('../views/General.vue'),
        props: {
            db: db,
        },
        meta: {
            requiresAuth: true,
        },
    },
    {
        path: "/kanban",
        component: () => import('../views/Kanban.vue'),
        props: {
            db: db,
        },
        meta: {
            requiresAuth: true,
        },
    },
    {
        path: "/:pathMatch(.*)*",
        component: () => import('../views/NotFound.vue'),
        meta: {
            requiresAuth: false,
        },
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach(async (to, from, next) => {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const currentUser = await getCurrentUser();

    if (requiresAuth && !currentUser) {
        next("/login");
    } else {
        next();
    }
});

export default router;

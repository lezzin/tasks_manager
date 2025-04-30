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
        component: () => import("../views/LoginView.vue"),
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
        component: () => import("../views/HomeView.vue"),
        props: { db: db },
        meta: {
            requiresAuth: true,
        },
    },
    {
        path: "/topic/:id",
        component: () => import("../views/HomeView.vue"),
        props: { db: db },
        meta: {
            requiresAuth: true,
        },
    },
    {
        path: "/general",
        component: () => import("../views/GeneralView.vue"),
        props: {
            db: db,
        },
        meta: {
            requiresAuth: true,
        },
    },
    {
        path: "/kanban",
        component: () => import("../views/KanbanView.vue"),
        props: {
            db: db,
        },
        meta: {
            requiresAuth: true,
        },
    },
    {
        path: "/pomodoro",
        component: () => import("../views/PomodoroView.vue"),
        meta: {
            requiresAuth: true,
        },
    },
    {
        path: "/:pathMatch(.*)*",
        component: () => import("../views/NotFoundView.vue"),
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
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
    const currentUser = await getCurrentUser();

    if (requiresAuth && !currentUser) {
        next("/login");
    } else {
        next();
    }
});

export default router;

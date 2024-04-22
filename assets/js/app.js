import { db, auth, provider } from "./firebase.js";
import Login from "./components/Login.js";
import Home from "./components/Home.js";
import General from "./components/General.js";
import NotFound from "./components/NotFound.js";

const routes = [
    {
        path: "/login",
        component: Login,
        props: {
            provider: provider,
            auth: auth,
        }
    },
    {
        path: "/",
        component: Home,
        props: {
            db: db,
            auth: auth,
        }
    },
    {
        path: "/topic/:id",
        component: Home,
        props: {
            db: db,
            auth: auth,
        }
    },
    {
        path: "/general",
        component: General,
        props: {
            db: db,
        }
    },
    {
        path: "*",
        component: NotFound
    },
];

const router = new VueRouter({
    routes
});

router.beforeEach((to, from, next) => {
    const currentUser = auth.currentUser;
    const requiresAuth = to.path !== "/login";

    if (requiresAuth && !currentUser) {
        next("/login");
    } else if (!requiresAuth && currentUser) {
        next("/");
    } else {
        next();
    }
});

function appInitialState() {
    return {
        user: null,
        toast: null,
        toastTimer: null,
        selectedTopicName: null,
        isMenuTopicsActive: false,
        isUserDropdownActive: false,
        showBtn: false,
    }
}

new Vue({
    router,
    data() {
        return appInitialState()
    },
    methods: {
        toggleUserDropdown() {
            this.isUserDropdownActive = !this.isUserDropdownActive;
        },
        toggleTopicsMenu() {
            this.isMenuTopicsActive = !this.isMenuTopicsActive;
            document.body.classList.toggle("menu-active", this.isMenuTopicsActive);
        },
        closeToast() {
            this.toast = null;
        },
        logoutUser() {
            auth.signOut();
            Object.assign(this.$data, appInitialState());
        },
        removeUser() {
            if (!this.user || !confirm("Deseja realmente excluir esse usuário?")) return;

            const docRef = db.collection("tasks").doc(this.user.uid);
            docRef.delete()
                .then(() => {
                    this.user.delete()
                        .then(() => {
                            Object.assign(this.$data, appInitialState());
                        })
                        .catch((error) => {
                            Promise.reject(error);
                        });
                })
                .catch((error) => {
                    this.toast = {
                        type: "error",
                        text: "Erro ao excluir documento: " + error
                    };
                });
        }
    },
    created() {
        auth.onAuthStateChanged(user => {
            document.querySelector(".loader-container").classList.add("hidden");

            if (!user) {
                if (this.$router.history.current.fullPath != "/login") this.$router.push("/login");
                return;
            }

            this.user = user;
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.toast && this.closeToast();
            }
        });

        document.addEventListener("click", e => {
            const dropdown = document.querySelector(".dropdown");
            if (dropdown && !dropdown.contains(e.target)) {
                this.isUserDropdownActive = false;
            }
        });
    },
    watch: {
        toast: function (_) {
            if (this.toastTimer) {
                clearTimeout(this.toastTimer);
            }

            this.toastTimer = setTimeout(() => {
                this.toast = null;
            }, 5000);
        }
    }
}).$mount("#app");
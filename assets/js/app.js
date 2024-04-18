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

// Vue Router instance
const router = new VueRouter({
    routes
});

const app = new Vue({
    router,
    data() {
        return {
            user: null,
            toast: null,
            toastTimer: null,
            selectedTopicName: null,
            isMobile: innerWidth <= 768,
            isMenuTopicsActive: false,
            loading: true,
        }
    },
    methods: {
        toggleTopicsMenu() {
            this.isMenuTopicsActive = !this.isMenuTopicsActive;
            document.body.classList.toggle("menu-active", this.isMenuTopicsActive);
        },
        closeToast() {
            this.toast = null;
        },
        logoutUser() {
            auth.signOut();
            this.$router.push("/login");
            this.user = this.selectedTopicName = null;
        }
    },
    created() {
        auth.onAuthStateChanged(user => {
            if (!user) {
                if (this.$router.history.current.fullPath != "/login") this.$router.push("/login");
                return;
            }

            this.user = user;
        });

        this.loading = false;

        addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeToast();
            }
        });

        addEventListener('resize', () => {
            this.isMobile = innerWidth <= 768;
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
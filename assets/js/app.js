import { onAuthStateChanged, signOut, deleteUser } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { auth, db } from "./libs/firebase.js";
import router from "./router.js";
import { DOC_NAME, TOAST_ANIMATION } from "./utils/variables.js";

function appInitialState() {
    return {
        lastRoute: null,
        user: null,
        toast: null,
        toastTimer: null,
        selectedTopicName: null,
        isMenuTopicsActive: false,
        isUserDropdownActive: false,
        showBtn: false,
    };
}

new Vue({
    router,
    data() {
        return appInitialState();
    },
    methods: {
        toggleUserDropdown() {
            this.isUserDropdownActive = !this.isUserDropdownActive;
        },
        toggleTopicsMenu() {
            this.isMenuTopicsActive = !this.isMenuTopicsActive;
        },
        closeToast() {
            this.toast = null;
        },
        showToast(type, message) {
            this.toast = {
                show: false,
                type: type,
                text: message
            }
        },
        async logoutUser() {
            try {
                await signOut(auth);
                Object.assign(this.$data, appInitialState());
            } catch ({ code, message }) {
                const errors = {
                    'auth/network-request-failed': 'Falha na conexão de rede. Verifique sua conexão e tente novamente.',
                    'auth/internal-error': 'Erro interno do servidor. Tente novamente mais tarde.',
                    'auth/no-current-user': 'Nenhum usuário autenticado no momento.'
                };

                this.showToast("error", errors[code] ?? `Erro ao sair: ${message}`)
            }
        },
        async removeUser() {
            if (!this.user || !confirm("Deseja realmente excluir esse usuário?")) return;

            const docRef = doc(db, DOC_NAME, this.user.uid);

            try {
                await deleteDoc(docRef);
                await deleteUser(auth.currentUser);
                Object.assign(this.$data, appInitialState());
                this.$router.push("/login");
            } catch ({ code, message }) {
                const errors = {
                    "auth/requires-recent-login": "Para excluir sua conta, faça login novamente e tente novamente.",
                    "auth/network-request-failed": "Falha na conexão de rede. Verifique sua conexão e tente novamente.",
                };

                this.showToast("error", errors[code] ?? message);
            }
        }
    },
    mounted() {
        onAuthStateChanged(auth, user => {
            document.querySelector(".loader-container").classList.add("hidden");

            if (user) {
                this.user = user;
            } else {
                this.$router.push("/login");
            }
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
                this.toast.show = false;

                setTimeout(() => {
                    this.toast = null;
                }, TOAST_ANIMATION * 2);
            }, 5000);
        },
    }
}).$mount("#app");

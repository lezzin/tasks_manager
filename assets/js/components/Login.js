import { PAGE_TITLES } from "../utils/variables.js";
import { signInWithPopup } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

const Login = {
    template: "#login-page",
    props: ["provider", "auth"],
    methods: {
        async loginGoogle() {
            try {
                const { user } = await signInWithPopup(this.auth, this.provider);
                this.$root.user = user;
                this.$router.push("/");
            } catch ({ code, message }) {
                const errors = {
                    'auth/popup-closed-by-user': 'O processo de autenticação foi cancelado.',
                    'auth/cancelled-popup-request': 'Aguarde o processo de autenticação ser concluído.',
                    'auth/popup-blocked': 'O navegador bloqueou o pop-up de autenticação. Desative o bloqueador de pop-up.',
                    'auth/account-exists-with-different-credential': 'Essa conta já está associada a outro provedor de autenticação.',
                    'auth/operation-not-allowed': 'Autenticação com este provedor não está habilitada.',
                    'auth/unauthorized-domain': 'O domínio atual não está autorizado para autenticação.',
                    'auth/user-disabled': 'Esse email de usuário está desativado.',
                    'auth/invalid-credential': 'As credenciais fornecidas são inválidas ou expiraram.',
                    'auth/web-storage-unsupported': 'O navegador não é compatível com armazenamento da Web necessário para autenticação.',
                };

                this.$root.toast = {
                    type: "error",
                    text: errors[code] ?? message
                };
            };
        },
    },
    mounted() {
        if (this.$root.user) {
            this.$router.push("/");
        }

        document.title = PAGE_TITLES.login;
        this.$root.showBtn = false;
    },
    watch: {
        "$root.user": function (user) {
            if (user) {
                this.$router.push("/");
            }
        }
    }
};

export default Login;

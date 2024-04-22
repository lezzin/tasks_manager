import {
    PAGE_TITLES
} from "../utils.js";

const Login = {
    template: "#login-page",
    props: ["provider", "auth"],
    methods: {
        loginGoogle() {
            this.auth
                .signInWithPopup(this.provider)
                .then(({
                    user
                }) => {
                    this.$root.user = user;
                })
                .catch(error => {
                    this.$root.toast = {
                        type: "error",
                        text: error.message
                    }
                });
        },
    },
    created() {
        document.title = PAGE_TITLES.login;
        this.$root.showBtn = false;
    },
    watch: {
        "$root.user": function(user) {
            if (user) this.$router.push("/");
        }
    }
}

export default Login;
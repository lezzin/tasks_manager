const Login = {
    template: "#login-page",
    props: ["provider", "auth"],
    methods: {
        loginGoogle() {
            this.auth
                .signInWithPopup(this.provider)
                .then((result) => {
                    const user = result.user;
                    this.$root.user = user;
                }).catch((error) => {
                    this.$root.toast = {
                        type: "error",
                        text: error.message
                    }
                });
        },
    },
    created() {
        document.title = "TaskFlow | Acessar sua conta";
   },
    watch: {
        "$root.user": function (user) {
            if (user) this.$router.push("/");
        }
    }
}

export default Login;
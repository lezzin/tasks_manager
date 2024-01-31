const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");

const toggleFormsBtns = document.querySelectorAll("[data-toggle-btn]");

function login() {
    const emailInput = loginForm.querySelector("[data-email]");
    const passwordInput = loginForm.querySelector("[data-password]");
    const btnSend = loginForm.querySelector("[data-btn]");
    const formMessage = loginForm.querySelector("[data-message]");

    btnSend.innerText = "Carregando...";
    formMessage.classList.add("hidden");
    formMessage.innerText = "";
    localStorage.removeItem("user_data");

    auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value)
        .then(response => {
            localStorage.setItem("user_data", JSON.stringify(response.user));
            window.location.href = "pages/task.html";
        })
        .catch(error => {
            if (error.code == "auth/invalid-credential") {
                formMessage.classList.remove("hidden");
                formMessage.innerText = "Usuário não encontrado";
            }

            btnSend.innerText = "Entrar";
        });
}

function register() {
    const emailInput = registerForm.querySelector("[data-email]");
    const passwordInput = registerForm.querySelector("[data-password]");
    const btnSend = registerForm.querySelector("[data-btn]");
    const formMessage = registerForm.querySelector("[data-message]");

    btnSend.innerText = "Carregando...";
    formMessage.classList.add("hidden");
    formMessage.innerText = "";

    auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value)
        .then((userCredential) => {
            formMessage.classList.remove("hidden");
            formMessage.innerText = "Usuário cadastrado com sucesso";

            btnSend.innerText = "Registra-se";
        })
        .catch((error) => {
            var errorMessage = error.message;

            formMessage.classList.remove("hidden");
            formMessage.innerText = errorMessage;

            btnSend.innerText = "Registra-se";
        });
}

loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    login();
})

registerForm.addEventListener("submit", function (e) {
    e.preventDefault();
    register();
})

toggleFormsBtns.forEach(element => {
    element.addEventListener("click", function () {
        const formToToggle = this.dataset.toggleForm;
        document.body.dataset.form = formToToggle;
    });
});
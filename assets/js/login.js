auth.onAuthStateChanged((user => {
    user && handleAuthenticatedUser(user);
}));

const inputContainers = document.querySelectorAll(".input-container");
const loginForm = document.querySelector("#login-form");
const recoverPasswordBtn = document.querySelector("[data-recover-password-btn]");
const registerForm = document.querySelector("#register-form");
const toggleFormsBtns = document.querySelectorAll("[data-toggle-btn]");

function setFormLoadingState(button, messageContainer) {
    button.innerHTML = '<span class="material-icons rotate">rotate_right</span> Carregando...';
    messageContainer.classList.add("hidden");
    messageContainer.innerText = "";
}

function handleAuthenticatedUser(user) {
    localStorage.setItem("user_data", JSON.stringify(user));
    window.location.href = "pages/task.html";
}

function handleLoginResponse(response, loginButton, messageContainer) {
    localStorage.setItem("user_data", JSON.stringify(response.user));
    window.location.href = "pages/task.html";
}

function handleLoginError(error, loginButton, messageContainer) {
    if ("auth/invalid-credential" === error.code) {
        messageContainer.classList.remove("hidden");
        messageContainer.innerText = "Usuário não encontrado";
    }
    loginButton.innerHTML = "Login";
}

function handleRegistrationSuccess(successMessageContainer, registerButton) {
    registerButton.innerHTML = "Registrar-se";
}

function handleRegistrationError(error, errorMessageContainer, registerButton) {
    console.log(error);
    if ("auth/email-already-in-use" === error.code) {
        errorMessageContainer.classList.remove("hidden");
        errorMessageContainer.innerText = "O e-mail fornecido já está em uso";
    } else if ("auth/invalid-password" === error.code) {
        errorMessageContainer.classList.remove("hidden");
        errorMessageContainer.innerText = "A senha deve conter pelo menos 6 caracteres";
    }
    registerButton.innerHTML = "Registrar-se";
}

function loginUser() {
    const emailInput = loginForm.querySelector("[data-email]");
    const passwordInput = loginForm.querySelector("[data-password]");
    const loginButton = loginForm.querySelector("[data-btn]");
    const messageContainer = loginForm.querySelector("[data-message]");
    setFormLoadingState(loginButton, messageContainer);
    localStorage.removeItem("user_data");
    auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value)
        .then(response => handleLoginResponse(response, loginButton, messageContainer))
        .catch(error => handleLoginError(error, loginButton, messageContainer));
}

function registerUser() {
    const emailInput = registerForm.querySelector("[data-email]");
    const passwordInput = registerForm.querySelector("[data-password]");
    const registerButton = registerForm.querySelector("[data-btn]");
    const errorMessageContainer = registerForm.querySelector("[data-message]");
    setFormLoadingState(registerButton, errorMessageContainer);
    auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value)
        .then(() => handleRegistrationSuccess(errorMessageContainer, registerButton))
        .catch(error => handleRegistrationError(error, errorMessageContainer, registerButton));
}

loginForm.addEventListener("submit", (event => {
    event.preventDefault();
    loginUser();
}));

registerForm.addEventListener("submit", (event => {
    event.preventDefault();
    registerUser();
}));

toggleFormsBtns.forEach(button => {
    button.addEventListener("click", function () {
        const formType = this.dataset.toggleForm;
        document.body.dataset.form = formType;
    });
});

recoverPasswordBtn.addEventListener("click", () => {
    const emailInput = loginForm.querySelector("[data-email]");
    const messageContainer = loginForm.querySelector("[data-message]");
    const recoverButton = loginForm.querySelector("[data-btn]");
    if (setFormLoadingState(recoverButton, messageContainer), !emailInput.value) {
        messageContainer.classList.remove("hidden");
        messageContainer.innerText = "O campo email deve ser preenchido";
        recoverButton.innerHTML = "Login";
    } else {
        auth.sendPasswordResetEmail(emailInput.value)
            .then(() => {
                messageContainer.classList.remove("hidden");
                messageContainer.innerText = "Email de redefinição de senha enviado";
                recoverButton.innerHTML = "Login";
            })
            .catch(error => {
                console.error(error);
                recoverButton.innerHTML = "Login";
            });
    }
});

inputContainers.forEach(container => {
    const inputField = container.querySelector("input");
    const label = container.querySelector("label");
    inputField.addEventListener("focus", () => {
        label.classList.add("animate", "animate-color");
    });
    inputField.addEventListener("blur", function () {
        this.value || label.classList.remove("animate");
        label.classList.remove("animate-color");
    });
});

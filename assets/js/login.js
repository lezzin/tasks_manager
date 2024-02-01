auth.onAuthStateChanged(user => {
    if (user) {
        localStorage.setItem("user_data", JSON.stringify(user));
        window.location.href = "pages/task.html";
    }
});

const inputContainers = document.querySelectorAll(".input-container");
const loginForm = document.querySelector("#login-form");
const recoverPasswordBtn = document.querySelector("[data-recover-password-btn]");
const registerForm = document.querySelector("#register-form");
const toggleFormsBtns = document.querySelectorAll("[data-toggle-btn]");

const setFormLoadingState = (btnSend, message) => {
    btnSend.innerHTML = `<span class="material-icons rotate">rotate_right</span> Carregando...`;
    message.classList.add("hidden");
    message.innerText = "";
};

const handleLoginResponse = (response) => {
    localStorage.setItem("user_data", JSON.stringify(response.user));
    window.location.href = "pages/task.html";
};

const handleLoginError = (error, btnSend, formMessage) => {
    if (error.code === "auth/invalid-credential") {
        formMessage.classList.remove("hidden");
        formMessage.innerText = "Usuário não encontrado";
    }
    btnSend.innerHTML = "Login";
};

const handleRegistrationSuccess = (formMessage, btnSend) => {
    formMessage.classList.remove("hidden");
    formMessage.innerText = "Usuário cadastrado com sucesso";
    btnSend.innerHTML = "Registrar-se";
};

const handleRegistrationError = (error, formMessage, btnSend) => {
    if (error.code === "auth/email-already-exists") {
        formMessage.classList.remove("hidden");
        formMessage.innerText = "O e-mail fornecido já está em uso por outro usuário";
    } else if (error.code === "auth/invalid-password") {
        formMessage.classList.remove("hidden");
        formMessage.innerText = "A senha deve conter pelo menos 6 caracteres";
    }
    btnSend.innerHTML = "Registrar-se";
};

const login = () => {
    const emailInput = loginForm.querySelector("[data-email]");
    const passwordInput = loginForm.querySelector("[data-password]");
    const btnSend = loginForm.querySelector("[data-btn]");
    const formMessage = loginForm.querySelector("[data-message]");

    setFormLoadingState(btnSend, formMessage);
    localStorage.removeItem("user_data");

    auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value)
        .then(response => handleLoginResponse(response))
        .catch(error => handleLoginError(error, btnSend, formMessage));
};

const register = () => {
    const emailInput = registerForm.querySelector("[data-email]");
    const passwordInput = registerForm.querySelector("[data-password]");
    const btnSend = registerForm.querySelector("[data-btn]");
    const formMessage = registerForm.querySelector("[data-message]");

    setFormLoadingState(btnSend, formMessage);

    auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value)
        .then(() => handleRegistrationSuccess(formMessage, btnSend))
        .catch(error => handleRegistrationError(error, formMessage, btnSend));
};

loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    login();
});

registerForm.addEventListener("submit", function (e) {
    e.preventDefault();
    register();
});

toggleFormsBtns.forEach(element => {
    element.addEventListener("click", function () {
        const formToToggle = this.dataset.toggleForm;
        document.body.dataset.form = formToToggle;
    });
});

recoverPasswordBtn.addEventListener("click", function (e) {
    const emailInput = loginForm.querySelector("[data-email]");
    const formMessage = loginForm.querySelector("[data-message]");
    const btnSend = loginForm.querySelector("[data-btn]");

    setFormLoadingState( btnSend, formMessage);

    if (!emailInput.value) {
        formMessage.classList.remove("hidden");
        formMessage.innerText = "O campo email deve ser preenchido";
        btnSend.innerHTML = "Login";
        return;
    }

    auth.sendPasswordResetEmail(emailInput.value)
        .then(() => {
            formMessage.classList.remove("hidden");
            formMessage.innerText = "Email de redefinição de senha enviado";
            btnSend.innerHTML = "Login";
        })
        .catch(error => {
            console.error(error);
            btnSend.innerHTML = "Login";
        });
});

inputContainers.forEach(inputContainer => {
    const input = inputContainer.querySelector("input");
    const label = inputContainer.querySelector("label");

    input.addEventListener("focus", function () {
        label.classList.add("animate", "animate-color");
    });

    input.addEventListener("blur", function () {
        if (!this.value) {
            label.classList.remove("animate");
        }

        label.classList.remove("animate-color");
    });
});

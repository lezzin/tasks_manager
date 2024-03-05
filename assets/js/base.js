const THEME_STORAGE_KEY = "theme";
const PALETTE_STORAGE_KEY = "palette";

const themeButton = document.querySelector("[data-change-theme]");
const paletteButtons = document.querySelectorAll("[data-change-palette]");
const dropdownButtons = document.querySelectorAll(".dropdown>button");

const firebaseConfig = {
    apiKey: "AIzaSyAm4vCa8oV78kmW-n4dkgSjm1ElDlWwBHE",
    authDomain: "task-manager-477c8.firebaseapp.com",
    projectId: "task-manager-477c8",
    storageBucket: "task-manager-477c8.appspot.com",
    messagingSenderId: "217541158610",
    appId: "1:217541158610:web:3874e0289705079c71ef0b",
    measurementId: "G-JSKE2D4G4V"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const analytics = firebase.analytics();

function addClass(element, className) {
    element.classList.add(className);
}

function removeClass(element, className) {
    element.classList.remove(className);
}

function toggleClass(element, className) {
    element.classList.toggle(className);
}

function removeClassIfExists(element, className) {
    if (element.classList.contains(className)) {
        element.classList.remove(className);
    }
}

function saveStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
}

function getStorage(key, returnEmpty) {
    return JSON.parse(localStorage.getItem(key)) || returnEmpty
}

function loadTheme() {
    let selectedTheme = getStorage(THEME_STORAGE_KEY, "light");
    document.body.dataset.theme = selectedTheme;
}

function loadPalette() {
    let selectedPalette = getStorage(PALETTE_STORAGE_KEY, "green");
    document.body.dataset.palette = selectedPalette;
}

function handleToggleDropdown(button) {
    const dropdown = button.nextElementSibling;

    button.addEventListener("click", () => {
        toggleClass(dropdown, "active");
        dropdown.firstElementChild.focus();
    });

    document.addEventListener("click", ({ target }) => {
        if (!button.contains(target)) {
            removeClass(dropdown, "active");
        }
    });
}

function handleChangePalette(button) {
    button.addEventListener("click", () => {
        const selectedPalette = button.dataset.changePalette;
        document.body.dataset.palette = selectedPalette;
        saveStorage(PALETTE_STORAGE_KEY, selectedPalette);
    });
}

themeButton.addEventListener("click", function () {
    document.body.dataset.theme = (document.body.dataset.theme == "light") ? "dark" : "light";
    saveStorage(THEME_STORAGE_KEY, document.body.dataset.theme)
});

dropdownButtons.forEach((button) => { handleToggleDropdown(button) });
paletteButtons.forEach((button) => handleChangePalette(button));

loadPalette();
loadTheme();
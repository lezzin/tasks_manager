const THEME_STORAGE_KEY = "theme";
const themeBtn = document.querySelector("[data-change-theme]");

const firebaseConfig = {
    apiKey: "AIzaSyAm4vCa8oV78kmW-n4dkgSjm1ElDlWwBHE",
    authDomain: "task-manager-477c8.firebaseapp.com",
    projectId: "task-manager-477c8",
    storageBucket: "task-manager-477c8.appspot.com",
    messagingSenderId: "217541158610",
    appId: "1:217541158610:web:3874e0289705079c71ef0b"
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();

function saveStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getStorage(key, returnEmpty) {
    return JSON.parse(localStorage.getItem(key)) || returnEmpty;
}

function loadTheme() {
    let selectedTheme = getStorage(THEME_STORAGE_KEY, "light");
    document.body.dataset.theme = selectedTheme;
}

themeBtn.addEventListener("click", function () {
    document.body.dataset.theme = (document.body.dataset.theme == "light") ? "dark" : "light";
    saveStorage(THEME_STORAGE_KEY, document.body.dataset.theme);
});

loadTheme();

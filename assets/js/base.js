const THEME_STORAGE_KEY = "theme";
const themeBtn = document.querySelector("[data-change-theme]");

const firebaseConfig = {
    apiKey: "AIzaSyB2eTy5G36or5O5GOWKGGtA4d-eDSy50VU",
    authDomain: "tasks-manager-3c26f.firebaseapp.com",
    projectId: "tasks-manager-3c26f",
    storageBucket: "tasks-manager-3c26f.appspot.com",
    messagingSenderId: "887940154878",
    appId: "1:887940154878:web:59749d1beab50568fb2caf"
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

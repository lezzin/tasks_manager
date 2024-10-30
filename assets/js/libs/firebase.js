import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyAA8sGugdiII_XCpl1esli27fVMwNCbSTk",
    authDomain: "task-flow-85478.firebaseapp.com",
    projectId: "task-flow-85478",
    storageBucket: "task-flow-85478.appspot.com",
    messagingSenderId: "338019562163",
    appId: "1:338019562163:web:d9e3dc70416b26bf0276c6",
    measurementId: "G-2K8X0EXWW4"
};

const provider = new GoogleAuthProvider();
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

getAnalytics(app);

export {
    auth,
    db,
    provider
};
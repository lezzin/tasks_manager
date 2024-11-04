import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyAA8sGugdiII_XCpl1esli27fVMwNCbSTk",
    authDomain: "task-flow-85478.firebaseapp.com",
    projectId: "task-flow-85478",
    storageBucket: "task-flow-85478.appspot.com",
    messagingSenderId: "338019562163",
    appId: "1:338019562163:web:d9e3dc70416b26bf0276c6",
    measurementId: "G-2K8X0EXWW4",
};

const provider = new GoogleAuthProvider();
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

getAnalytics(app);

export { auth, db, provider };

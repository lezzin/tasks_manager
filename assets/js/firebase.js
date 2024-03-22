const firebaseConfig = {
    apiKey: "AIzaSyAA8sGugdiII_XCpl1esli27fVMwNCbSTk",
    authDomain: "task-flow-85478.firebaseapp.com",
    projectId: "task-flow-85478",
    storageBucket: "task-flow-85478.appspot.com",
    messagingSenderId: "338019562163",
    appId: "1:338019562163:web:d9e3dc70416b26bf0276c6",
    measurementId: "G-2K8X0EXWW4"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const analytics = firebase.analytics();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

export {
    auth,
    db,
    provider
};
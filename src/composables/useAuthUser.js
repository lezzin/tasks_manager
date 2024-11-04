import { ref } from 'vue';
import { auth } from '../libs/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';

const user = ref(auth.currentUser);

function initAuthListener() {
    onAuthStateChanged(auth, (currentUser) => {
        user.value = currentUser;
    });
}

export function useAuthUser() {
    if (!user.value) initAuthListener();
    return { user };
}

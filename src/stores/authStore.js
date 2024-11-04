import { defineStore } from 'pinia';
import { ref } from 'vue';
import { auth } from '../libs/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';

export const useAuthStore = defineStore('auth', () => {
    const user = ref(auth.currentUser);

    function initAuthListener() {
        onAuthStateChanged(auth, (currentUser) => {
            user.value = currentUser;
        });
    }

    initAuthListener();

    return {
        user,
    };
});

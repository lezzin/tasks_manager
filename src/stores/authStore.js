import { defineStore } from 'pinia';
import { ref } from 'vue';
import { auth, db } from '../libs/firebase.js';
import { deleteUser, onAuthStateChanged, signOut } from 'firebase/auth';
import { PRINCIPAL_DOC_NAME } from '../utils/variables.js';
import { deleteDoc, doc } from 'firebase/firestore';

export const useAuthStore = defineStore('auth', () => {
    const user = ref(auth.currentUser);

    const initAuthListener = () => {
        onAuthStateChanged(auth, (currentUser) => {
            user.value = currentUser;
        });
    }

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            throw error;
        }
    };

    const deleteAccount = async () => {
        const docRef = doc(db, PRINCIPAL_DOC_NAME, user.value.uid);

        try {
            await deleteDoc(docRef);
            await deleteUser(auth.currentUser);
        } catch (error) {
            throw error;
        }
    };

    initAuthListener();

    return {
        user,
        logout,
        deleteAccount
    };
});

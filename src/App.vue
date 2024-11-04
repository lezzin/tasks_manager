<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router';
import Toast from './components/Toast.vue';
import { useToast } from './composables/useToast';
import { provide, ref } from 'vue';
import { useAuthStore } from './stores/authStore';
import { auth, db } from './libs/firebase';
import { DOC_NAME } from './utils/variables';
import { deleteDoc } from 'firebase/firestore';
import { deleteUser, signOut } from 'firebase/auth';
import { storeToRefs } from 'pinia'

const { toast, closeToast, showToast } = useToast();

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const router = useRouter();
const isMenuTopicsActive = ref(false);

const toggleTopicsMenu = () => {
    isMenuTopicsActive.value = !isMenuTopicsActive.value;
}

provide("isMenuTopicsActive", isMenuTopicsActive);

const isAccountDropdownActive = ref(false);
const toggleAccountDropdown = () => {
    isAccountDropdownActive.value = !isAccountDropdownActive.value;
}

const showTopicNavBtn = ref(false);
provide("showTopicNavBtn", showTopicNavBtn);

const logoutUser = async () => {
    try {
        await signOut(auth);
    } catch ({ code, message }) {
        const errors = {
            "auth/network-request-failed":
                "Falha na conexão de rede. Verifique sua conexão e tente novamente.",
            "auth/internal-error": "Erro interno do servidor. Tente novamente mais tarde.",
            "auth/no-current-user": "Nenhum usuário autenticado no momento.",
        };

        showToast("error", errors[code] ?? `Erro ao sair: ${message}`);
    }
}

const removeUser = async () => {
    if (!user || !confirm("Deseja realmente excluir esse usuário?")) return;

    const docRef = doc(db, DOC_NAME, user.uid);

    try {
        await deleteDoc(docRef);
        await deleteUser(auth.currentUser);
        router.push("/login");
    } catch ({ code, message }) {
        const errors = {
            "auth/requires-recent-login":
                "Para excluir sua conta, faça login novamente e tente novamente.",
            "auth/network-request-failed":
                "Falha na conexão de rede. Verifique sua conexão e tente novamente.",
        };

        showToast("error", errors[code] ?? message);
    }
}
</script>

<template>
    <header class="header-wrapper">
        <div class="header container">
            <div class="header__logo">
                <button class="btn btn--only-icon btn--primary btn--mobile" @click="toggleTopicsMenu"
                    v-if="showTopicNavBtn">
                    <i class="fa-solid fa-bars"></i>
                </button>

                <RouterLink to="/" title="Acessar página incial" class="logo">
                    <img src="./assets/img/logo_lg.svg" alt="TaskFlow - logo do website" width="148" height="37"
                        loading="lazy" v-if="!showTopicNavBtn" />
                    <img src="./assets/img/logo_sm.svg" alt="TaskFlow - logo do website" width="118" height="37"
                        loading="lazy" v-if="showTopicNavBtn" />
                </RouterLink>
            </div>

            <button class="account btn btn--bordered" @click.stop="toggleAccountDropdown" title="Abrir/fechar dropdown"
                v-if="user">
                <div class="account__details">
                    <p class="text text--small">Olá, {{ user.displayName }}</p>
                    <p class="text text--smallest">{{ user.email }}</p>
                </div>

                <img class="account__avatar" :src="user.photoURL" alt="Foto de perfil do usuário" width="37" height="37"
                    :title="`Logado como: ${user.email}`" />

                <span class="account__arrow"> <i class="fa-solid fa-caret-down"></i> </span>
            </button>

            <div :class="['dropdown', isAccountDropdownActive && 'active']">
                <div class="dropdown__menu">
                    <button class="btn btn--outline-danger btn--icon" @click="logoutUser" title="Sair da minha conta">
                        <i class="fa-solid fa-right-from-bracket"></i> Sair da conta
                    </button>
                    <button class="btn btn--danger btn--icon" @click="removeUser" title="Excluir minha conta">
                        <i class="fa-solid fa-right-from-bracket"></i> Excluir conta
                    </button>
                </div>
            </div>

            <Toast :data="toast" @close="closeToast" />
        </div>
    </header>

    <main>
        <RouterView></RouterView>
    </main>
</template>
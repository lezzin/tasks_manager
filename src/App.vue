<script setup>
import { auth, db } from './libs/firebase';
import { DOC_NAME } from './utils/variables';
import { baseUrl } from './utils/urlUtils';

import { RouterLink, RouterView, useRouter } from 'vue-router';
import { deleteUser, signOut } from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import { storeToRefs } from "pinia";
import { ref, provide } from 'vue';

import { useToast } from './composables/useToast';
import { useAuthStore } from './stores/authStore';

import LoaderContainer from './components/shared/LoaderContainer.vue';
import ToastFeedback from './components/shared/ToastFeedback.vue';
import UIButton from './components/ui/UIButton.vue';
import UIDropdown from './components/ui/UIDropdown.vue';

const authStore = useAuthStore();
const { toast, closeToast, showToast } = useToast();
const { user } = storeToRefs(authStore);

const router = useRouter();

const isMenuTopicsActive = ref(false);
const isAccountDropdownActive = ref(false);
const showTopicNavBtn = ref(false);

provide("isMenuTopicsActive", isMenuTopicsActive);
provide("showTopicNavBtn", showTopicNavBtn);

const toggleTopicsMenu = () => {
    isMenuTopicsActive.value = !isMenuTopicsActive.value;
};

const toggleAccountDropdown = () => {
    isAccountDropdownActive.value = !isAccountDropdownActive.value;
};

const logoutUser = async () => {
    try {
        await signOut(auth);
        router.push("/login");
        isAccountDropdownActive.value = false;
    } catch ({ code, message }) {
        const errors = {
            "auth/network-request-failed":
                "Falha na conexão de rede. Verifique sua conexão e tente novamente.",
            "auth/internal-error": "Erro interno do servidor. Tente novamente mais tarde.",
            "auth/no-current-user": "Nenhum usuário autenticado no momento.",
        };

        showToast("danger", errors[code] ?? `Erro ao sair: ${message}`);
    }
};

const removeUser = async () => {
    if (!user || !confirm("Deseja realmente excluir esse usuário?")) return;

    const docRef = doc(db, DOC_NAME, user.value.uid);

    try {
        await deleteDoc(docRef);
        await deleteUser(auth.currentUser);
        router.push("/login");
        isAccountDropdownActive.value = false;
    } catch ({ code, message }) {
        const errors = {
            "auth/requires-recent-login":
                "Para excluir sua conta, faça login e tente novamente.",
            "auth/network-request-failed":
                "Falha na conexão de rede. Verifique sua conexão e tente novamente.",
        };

        showToast("danger", errors[code] ?? message);
    }
};
</script>

<template>
    <LoaderContainer />

    <header class="header-wrapper">
        <div class="header container">
            <div class="header__logo">
                <UIButton variant="primary" isIcon @click="toggleTopicsMenu" v-if="showTopicNavBtn"
                    title="Alternar menu de tópicos">
                    <fa :icon="isMenuTopicsActive ? 'times' : 'bars'" />
                </UIButton>

                <RouterLink to="/" title="Acessar página inicial" class="logo">
                    <img v-if="showTopicNavBtn" :src="baseUrl('logo_sm.svg')" alt="TaskFlow - logo do website"
                        width="148" height="37" loading="lazy" />
                    <img v-else :src="baseUrl('logo_lg.svg')" alt="TaskFlow - logo do website" width="176" height="37"
                        loading="lazy" />
                </RouterLink>
            </div>

            <UIDropdown :isActive="isAccountDropdownActive" @trigger="toggleAccountDropdown" v-if="user">
                <template #trigger="{ trigger }">
                    <UIButton isBordered class="account" title="Abrir/fechar dropdown" @click="trigger">
                        <div class="account__details">
                            <p class="text text--small">Olá, {{ user.displayName }}</p>
                            <p class="text text--smallest">{{ user.email }}</p>
                        </div>

                        <img class="account__avatar" :src="user.photoURL" alt="Foto de perfil do usuário" width="37"
                            height="37" :title="`Logado como: ${user.email}`" />

                        <span class="account__arrow">
                            <fa icon="caret-down" />
                        </span>
                    </UIButton>
                </template>

                <template #menu>
                    <UIButton isDropdown variant="outline-danger" @click="logoutUser" title="Sair da minha conta">
                        <fa icon="right-from-bracket" /> Sair da conta
                    </UIButton>
                    <UIButton isDropdown variant="danger" @click="removeUser" title="Excluir minha conta">
                        <fa icon="trash" /> Excluir conta
                    </UIButton>
                </template>
            </UIDropdown>

            <ToastFeedback :data="toast" @close="closeToast" />
        </div>
    </header>

    <main>
        <RouterView></RouterView>
    </main>
</template>

<style>
.btn.account {
    display: flex;
    align-items: center;
    gap: .5rem;
    padding: 0.3rem 0.3rem 0.3rem 1rem;
    cursor: pointer;
    background-color: var(--bg-secondary);

    .account__details {
        text-align: right;

        .text--small {
            font-weight: 500;
        }
    }

    @media(width <=768px) {
        .account__details {
            display: none;
        }
    }

    .account__avatar {
        border-radius: 50%;
        border: 1px solid var(--border-color);
    }

    .account__arrow {
        transform: translateY(-2px);
        margin-inline: 0.5rem;
    }
}
</style>
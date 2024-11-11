<script setup>
import { baseUrl } from '../../utils/urlUtils';
import { auth } from '../../libs/firebase';

import { useRouter } from 'vue-router';
import { ref } from 'vue';
import { storeToRefs } from 'pinia';

import { useToast } from '../../composables/useToast';
import { useAuthStore } from '../../stores/authStore';
import { useSidebarStore } from '../../stores/sidebarStore';
import { useLoadingStore } from '../../stores/loadingStore';

import UIButton from '../ui/UIButton.vue';
import UIDropdown from '../ui/UIDropdown.vue';

const authStore = useAuthStore();
const loadingStore = useLoadingStore();
const { logout, deleteAccount } = authStore;
const { user } = storeToRefs(authStore);
const { showToast } = useToast();

const sidebarStore = useSidebarStore();

const router = useRouter();
const isAccountDropdownActive = ref(false);

const toggleAccountDropdown = () => {
    isAccountDropdownActive.value = !isAccountDropdownActive.value;
};

const logoutUser = async () => {
    loadingStore.showLoader();

    try {
        await logout(auth);
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
    } finally {
        loadingStore.hideLoader();
    }
};

const removeUser = async () => {
    if (!confirm("Deseja realmente excluir esse usuário?")) return;

    loadingStore.showLoader();

    try {
        await deleteAccount();
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
    } finally {
        loadingStore.hideLoader();
    }
};
</script>

<template>
    <header class="header-wrapper">
        <div class="header container">
            <div class="header__logo">
                <UIButton variant="primary" isIcon @click="sidebarStore.toggleSidebar"
                    v-if="sidebarStore.canShowSidebarToggler" title="Alternar menu de tópicos">
                    <fa :icon="sidebarStore.isTopicSidebarActive ? 'times' : 'bars'" />
                </UIButton>

                <RouterLink to="/" title="Acessar página inicial" class="logo">
                    <img v-if="sidebarStore.canShowSidebarToggler" :src="baseUrl('logo_sm.svg')"
                        alt="TaskFlow - logo do website" width="148" height="37" loading="lazy" />
                    <img v-else :src="baseUrl('logo_lg.svg')" alt="TaskFlow - logo do website" width="176" height="37"
                        loading="lazy" />
                </RouterLink>
            </div>

            <UIDropdown :isActive="isAccountDropdownActive" @update:isActive="toggleAccountDropdown" v-if="user">
                <template #trigger="{ trigger }">
                    <UIButton isBordered class="account" title="Abrir/fechar dropdown" @click="toggleAccountDropdown">
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
        </div>
    </header>
</template>

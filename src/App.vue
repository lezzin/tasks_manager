<script setup>
import { RouterView } from 'vue-router';
import Toast from './components/Toast.vue';
import { useToast } from './composables/useToast';
import { provide, ref } from 'vue';

const { toast, closeToast } = useToast();
const user = ref(null);
const isMenuTopicsActive = ref(false);
const isUserDropdownActive = ref(false);
const showTopicNavBtn = ref(false);

const toggleTopicsMenu = () => {
    isMenuTopicsActive.value = !isMenuTopicsActive.value;
}

provide("isMenuTopicsActive", isMenuTopicsActive);
provide("showTopicNavBtn", showTopicNavBtn);
</script>

<template>
    <header class="header-wrapper">
        <div class="header container">
            <div class="header__logo">
                <button class="btn btn--only-icon btn--primary btn--mobile" @click="toggleTopicsMenu" v-if="showTopicNavBtn">
                    <i class="fa-solid fa-bars"></i>
                </button>

                <router-link to="/" title="Acessar página incial" class="logo">
                    <img src="./assets/img/logo_lg.svg" alt="TaskFlow - logo do website" width="148" height="37"
                        loading="lazy" v-if="!showTopicNavBtn" />
                    <img src="./assets/img/logo_sm.svg" alt="TaskFlow - logo do website" width="118" height="37"
                        loading="lazy" v-if="showTopicNavBtn" />
                </router-link>
            </div>

            <button class="account btn btn--bordered" @click.stop="toggleUserDropdown" title="Abrir/fechar dropdown"
                v-if="user">
                <div class="account__details">
                    <p class="text text--small">Olá, {{ user.displayName }}</p>
                    <p class="text text--smallest">{{ user.email }}</p>
                </div>

                <img class="account__avatar" :src="user.photoURL" alt="Foto de perfil do usuário" width="37" height="37"
                    :title="`Logado como: ${user.email}`" />

                <span class="account__arrow"> <i class="fa-solid fa-caret-down"></i> </span>
            </button>

            <div :class="['dropdown', isUserDropdownActive && 'active']">
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
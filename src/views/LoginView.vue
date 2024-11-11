<script setup>
import { PAGE_TITLES } from '../utils/variables.js';

import { ref, watchEffect, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { signInWithPopup } from 'firebase/auth';

import { useToast } from '../composables/useToast.js';
import { useAuthStore } from '../stores/authStore.js';
import { useLoadingStore } from '../stores/loadingStore.js';
import { useSidebarStore } from '../stores/sidebarStore.js';

import ImageResponsive from '../components/shared/ImageResponsive.vue';
import UIButton from '../components/ui/UIButton.vue';
import CreatorLink from '../components/shared/CreatorLink.vue';

const { provider, auth } = defineProps(['provider', 'auth']);
const { showToast } = useToast();
const { user } = useAuthStore();
const loadingStore = useLoadingStore();

const router = useRouter();
const { setShowSidebarToggler } = useSidebarStore();

const loading = ref(false);

async function loginGoogle() {
    loading.value = true;

    try {
        await signInWithPopup(auth, provider);
        router.push('/');
    } catch ({ code, message }) {
        const errors = {
            'auth/popup-closed-by-user': 'O processo de autenticação foi cancelado.',
            'auth/cancelled-popup-request': 'Aguarde o processo de autenticação ser concluído.',
            'auth/popup-blocked': 'O navegador bloqueou o pop-up de autenticação. Desative o bloqueador de pop-up.',
            'auth/account-exists-with-different-credential': 'Essa conta já está associada a outro provedor de autenticação.',
            'auth/operation-not-allowed': 'Autenticação com este provedor não está habilitada.',
            'auth/unauthorized-domain': 'O domínio atual não está autorizado para autenticação.',
            'auth/user-disabled': 'Esse email de usuário está desativado.',
            'auth/invalid-credential': 'As credenciais fornecidas são inválidas ou expiraram.',
            'auth/web-storage-unsupported': 'O navegador não é compatível com armazenamento da Web necessário para autenticação.',
        };

        showToast("danger", errors[code] ?? message);
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    if (user) {
        router.push('/');
    }

    document.title = PAGE_TITLES.login;
    setShowSidebarToggler(false);
    loadingStore.hideLoader();
});

watchEffect(() => {
    if (user) {
        router.push('/');
    }
});
</script>

<template>
    <div class="form-wrapper">
        <form style="--form-width: 450px" @submit.prevent="loginGoogle" role="form" aria-labelledby="login-heading">
            <h2 id="login-heading" class="sr-only">Formulário de Login com Google</h2>

            <ImageResponsive small="login_sm.png" lg="login_lg.png" alt="Uma pessoa escrevendo em um caderno" />

            <UIButton type="submit" :title="loading ? 'Entrando...' : 'Entrar com o Google'" :disabled="loading"
                aria-label="Entrar com o Google" aria-live="polite" aria-busy="loading">
                <img src="/src/assets/img/google-logo.png" alt="Logo do Google" width="24" height="24">
                <span v-if="loading">Carregando...</span>
                <span v-else>Entrar com o Google</span>
            </UIButton>

            <CreatorLink />
        </form>
    </div>
</template>

<style scoped>
.btn {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    gap: 1rem;
}
</style>
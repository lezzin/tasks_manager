<script setup>
import { PAGE_TITLES } from '../utils/variables.js';

import { ref, watchEffect, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { signInWithPopup } from 'firebase/auth';

import { useToast } from '../composables/useToast.js';
import { useAuthStore } from '../stores/authStore.js';

const { provider, auth } = defineProps(['provider', 'auth']);
const { showToast } = useToast();
const { user } = useAuthStore();
const router = useRouter();
const route = useRoute();

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

        console.error(`Authentication error [${code}]: ${message}`);
        showToast('error', errors[code] ?? message);
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    if (user) {
        router.push('/');
    }
    document.title = PAGE_TITLES.login;
    route.meta.showTopicNavBtn = false;
});

watchEffect(() => {
    if (user) {
        router.push('/');
    }
});
</script>

<template>
    <div class="form-wrapper">
        <form style="--form-width: 450px" @submit.prevent="loginGoogle">
            <img src="/src/assets/img/login_lg.png" alt="Uma pessoa escrevendo em um caderno" class="large-screen"
                width="1200" height="800" loading="lazy" />
            <img src="/src/assets/img/login_sm.png" alt="Uma pessoa escrevendo em um caderno" class="small-screen"
                width="640" height="640" loading="lazy" />

            <button class="btn btn--block btn--icon btn--primary" title="Entrar com o Google" :disabled="loading"
                aria-label="Entrar com o Google">
                <i class="fa-brands fa-google"></i>
                <span v-if="loading">Carregando...</span>
                <span v-else>Entrar com o Google</span>
            </button>
        </form>
    </div>
</template>

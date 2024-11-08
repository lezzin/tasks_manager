<script setup>
import { onMounted } from 'vue';
import { useLoadingStore } from '../stores/loadingStore.js';
import ImageResponsive from '../components/shared/ImageResponsive.vue';

const loadingStore = useLoadingStore();

onMounted(() => {
    loadingStore.hideLoader();
})
</script>

<template>
    <div class="container image-centered" role="alert" aria-live="assertive">
        <RouterLink to="/" title="Voltar para o início">
            <ImageResponsive small="not_found_sm.png" lg="not_found_lg.png"
                alt="Homem segurando uma lupa e frase de página não encontrada" />
        </RouterLink>
    </div>
</template>
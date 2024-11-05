<script setup>
import { onMounted } from 'vue';
import { useLoadingStore } from '../stores/loadingStore.js';
import Image from '../components/Image.vue';

const loadingStore = useLoadingStore();

onMounted(() => {
    loadingStore.hideLoader();
})
</script>

<template>
    <div class="container image-centered">
        <Image small="not_found_sm.png" lg="not_found_lg.png"
            alt="Homem segurando uma lupa e frase de página não encontrada" />
    </div>
</template>
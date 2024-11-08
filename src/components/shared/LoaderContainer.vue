<script setup>
import { useLoadingStore } from '../../stores/loadingStore';

const loadingStore = useLoadingStore();

</script>

<template>
    <div class="loader" v-if="loadingStore.isLoading" role="alert" aria-live="polite" aria-busy="true">
        <div class="loader__spinner" aria-hidden="true"></div>
    </div>
</template>

<style scoped>
@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.loader {
    position: fixed;
    background-color: var(--bg-primary);
    inset: 0;
    display: grid;
    place-items: center;
    z-index: 999;

    .loader__spinner {
        border-radius: 50%;
        width: 4rem;
        aspect-ratio: 1;
        border: 4px solid var(--bg-secondary);
        border-left-color: var(--details-color);
        animation: spin 1s linear infinite;
    }
}
</style>
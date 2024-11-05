<script setup>
import { useLoadingStore } from '../stores/loadingStore';

const loadingStore = useLoadingStore();

</script>

<template>
    <div class="loader" v-if="loadingStore.isLoading">
        <div class="loader__spinner"></div>
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
    opacity: 1;
    transition: opacity .3s ease-out;
    z-index: 999;

    &.hidden {
        opacity: 0;
        pointer-events: none;
    }

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
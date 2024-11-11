import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useLoadingStore = defineStore('loading', () => {
    const isLoading = ref(true);

    const showLoader = () => {
        isLoading.value = true;
    }

    const hideLoader = () => {
        isLoading.value = false;
    }

    return {
        isLoading,
        showLoader,
        hideLoader
    }
});

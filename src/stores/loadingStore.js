import { defineStore } from 'pinia';

export const useLoadingStore = defineStore('app', {
    state: () => ({
        isLoading: true
    }),
    actions: {
        showLoader() {
            this.isLoading = true;
        },
        hideLoader() {
            this.isLoading = false;
        }
    }
});

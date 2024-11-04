import { defineStore } from 'pinia';

export const useTaskStore = defineStore('task', {
    state: () => ({
        isEditFormVisible: false,
        task: null
    }),
    actions: {
        openEditTaskModal(task) {
            this.isEditFormVisible = true;
            this.task = task;
        },
        closeEditTaskModal() {
            this.isEditFormVisible = false;
            this.task = null;
        },
    }
});

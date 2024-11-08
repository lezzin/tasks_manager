<script setup>
import { useToast } from '../../composables/useToast';
import { useTask } from '../../composables/useTask';
import { useAuthStore } from '../../stores/authStore';
import { useModal } from '../../composables/useModal';

import { marked } from 'marked';
import { inject, markRaw, ref } from 'vue';

import TaskFormEdit from '../forms/TaskFormEdit.vue';
import CommentModal from '../modals/CommentModal.vue';
import TaskItem from './TaskItem.vue';

const modal = useModal();
const taskComposable = useTask();
const { user } = useAuthStore();
const { showToast } = useToast();

const props = defineProps({
    topic: {
        type: String,
        required: true
    },
    tasks: {
        type: Object,
        required: true
    }
});

const editingTask = ref(null);
const selectedComment = ref(null);

const filterTask = inject("filterTask");
const searchTask = inject("searchTask");

const changeTaskStatus = async (taskToUpdate) => {
    try {
        await taskComposable.changeStatus(props.tasks, taskToUpdate, user.uid);
        showToast("success", "Status de conclusão alterado com sucesso");
        filterTask.value = "all";
        searchTask.value = "";
    } catch (error) {
        showToast("danger", "Erro ao alterar status da tarefa.");
    }
};

const deleteTask = async (taskToDelete) => {
    if (!confirm("Tem certeza que deseja excluir essa tarefa? Essa ação não poderá ser desfeita!")) return;

    try {
        await taskComposable.deleteTask(props.tasks, taskToDelete, user.uid);
        showToast("success", "Tarefa excluída com sucesso!");
    } catch (error) {
        showToast("danger", "Erro ao excluir tarefa.");
    }
};

const openEditTaskModal = (task) => {
    editingTask.value = task;
    modal.component.value = markRaw(TaskFormEdit);
    modal.showModal();
};

const openTaskComment = (comment) => {
    selectedComment.value = marked(comment);
    modal.component.value = markRaw(CommentModal);
    modal.showModal();
};
</script>

<template>
    <div class="task-nav">
        <TaskItem v-for="task in props.tasks" :key="task.id" :task="task" @changeStatus="changeTaskStatus"
            @edit="openEditTaskModal" @openComment="openTaskComment" @delete="deleteTask" />

        <p class="text text--center" v-if="props.tasks.length === 0">
            Nenhuma tarefa para esse filtro
        </p>
    </div>

    <Teleport to="#modal">
        <Transition>
            <component :is="modal.component.value" v-if="modal.show.value" @close="modal.hideModal"
                v-bind="{ topic: props.topic, task: editingTask, comment: selectedComment }" />
        </Transition>
    </Teleport>
</template>

<style scoped>
.task-nav {
    display: grid;
    gap: 0.6rem;
    padding-bottom: 5rem;
}
</style>

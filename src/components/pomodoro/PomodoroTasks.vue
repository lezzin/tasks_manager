<script setup>
import { PAGE_TITLES, TASK_KANBAN_STATUSES } from "../../utils/variables";

import { onMounted, reactive, ref, markRaw, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { marked } from "marked";

import { useAuthStore } from "../../stores/authStore";
import { useLoadingStore } from "../../stores/loadingStore";
import { useToast } from "../../composables/useToast";
import { useModal } from "../../composables/useModal";
import { useTask } from "../../composables/useTask";

import CommentModal from "../task/CommentModal.vue";
import UIButton from "../ui/UIButton.vue";
import Task from "../task/TaskItem.vue";

const props = defineProps({
    hasTasks: { type: Boolean },
});

const { showToast } = useToast();
const { user } = useAuthStore();
const loadingStore = useLoadingStore();

const router = useRouter();
const modal = useModal();
const { getUserTasksWithTopic, changeStatus } = useTask();

const tasks = reactive({ data: [] });

const isDropdownOpen = ref(false);
const selectedComment = ref("");

const loadTasks = async () => {
    loadingStore.showLoader();
    try {
        tasks.data = await getUserTasksWithTopic(user.uid);
    } catch (error) {
        showToast("danger", error.message);
        if (error.code === "topic-not-found" || error.code === "doc-not-found") {
            router.push("/");
        }
    } finally {
        loadingStore.hideLoader();
    }
};

const handleChangeTaskStatus = async (taskToUpdate) => {
    try {
        const newStatus = await changeStatus(taskToUpdate, user.uid);
        taskToUpdate.status = newStatus;
        taskToUpdate.kanbanStatus = newStatus
            ? TASK_KANBAN_STATUSES.completed
            : TASK_KANBAN_STATUSES.todo;
        showToast("success", "Status de conclusão alterado com sucesso.");
    } catch (error) {
        showToast("danger", "Erro ao alterar status da tarefa.");
    }
};

const toggleDropdown = () => {
    isDropdownOpen.value = !isDropdownOpen.value;
};

const openTaskComment = (comment) => {
    selectedComment.value = marked(comment);
    modal.component.value = markRaw(CommentModal);
    modal.showModal();
};

onMounted(() => {
    document.title = PAGE_TITLES.pomodoro;
    loadTasks();
});
</script>

<template>
    <p class="text text--icon" v-if="!hasTasks">
        <fa icon="exclamation-circle" />
        <span> Crie uma nova tarefa para começar a utilizar o Pomodoro da melhor maneira.</span>
    </p>

    <div class="pomodoro-tasks-wrapper" v-else>
        <UIButton variant="outline-primary" @click="toggleDropdown" title="Exibir tarefas">
            <fa :icon="isDropdownOpen ? 'eye-slash' : 'eye'" />
            {{ isDropdownOpen ? "Fechar" : "Exibir" }} tarefas
        </UIButton>

        <Transition name="slide">
            <div class="task-nav" v-if="isDropdownOpen">
                <Task
                    v-for="task in tasks.data"
                    :key="task.id"
                    :task="task"
                    @changeStatus="handleChangeTaskStatus"
                    :showPriorities="false"
                    :showEdit="false"
                    :showDelete="false"
                    :showCompletedStatus="false"
                    :showComment="true"
                    @openComment="openTaskComment"
                    variant="smaller"
                />
            </div>
        </Transition>

        <Teleport to="#modal">
            <Transition>
                <CommentModal
                    v-if="modal.show.value"
                    @close="modal.hideModal"
                    :comment="selectedComment"
                    id="comment-modal"
                />
            </Transition>
        </Teleport>
    </div>
</template>
<style scoped>
.pomodoro-tasks-wrapper {
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 1rem;
    width: 90%;
    max-width: 500px;
}

.task-nav {
    display: grid;
    gap: 0.6rem;
    max-height: 160px;
    overflow-y: auto;
    width: 100%;
    padding-inline: var(--padding);
}

.slide-enter-active,
.slide-leave-active {
    transition: all var(--screen-transition) ease;
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
    max-height: 0;
}
</style>

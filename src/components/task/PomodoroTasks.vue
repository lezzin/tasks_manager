<script setup>
import { PAGE_TITLES, TASK_KANBAN_STATUSES } from '../../utils/variables';

import { onMounted, reactive, ref, markRaw } from 'vue';
import { useRouter } from 'vue-router';
import { marked } from 'marked';

import { useAuthStore } from '../../stores/authStore';
import { useLoadingStore } from '../../stores/loadingStore';
import { useToast } from '../../composables/useToast';
import { useModal } from '../../composables/useModal';
import { useTask } from '../../composables/useTask';

import CommentModal from '../modals/CommentModal.vue';
import Task from '../task/TaskItem.vue';

const emit = defineEmits(["update"]);

const props = defineProps({
    canShake: {
        type: Boolean,
        required: true
    }
})

const loadingStore = useLoadingStore();
const { showToast } = useToast();
const { user } = useAuthStore();
const modal = useModal();
const taskComposable = useTask();
const router = useRouter();

const tasks = reactive({ data: [] });
const dropdownOpen = ref(false);
const selectedTask = reactive({ value: null });
const selectedComment = ref("");

const loadTasks = async () => {
    loadingStore.showLoader();

    try {
        tasks.data = await taskComposable.getUserTasks(user.uid);
    } catch (error) {
        showToast("danger", error.message);

        if (error.code === "topic-not-found" || error.code === "doc-not-found") {
            router.push("/");
        }
    } finally {
        loadingStore.hideLoader();
    }
};

const changeTaskStatus = async (taskToUpdate) => {
    try {
        const newStatus = await taskComposable.changeStatus(tasks.data, taskToUpdate, user.uid);
        taskToUpdate.status = newStatus;
        taskToUpdate.kanbanStatus = newStatus ? TASK_KANBAN_STATUSES.completed : TASK_KANBAN_STATUSES.todo;
        showToast("success", "Status de conclusão alterado com sucesso");
    } catch (error) {
        showToast("danger", "Erro ao alterar status da tarefa.");
    }
};

const selectTask = (task) => {
    if (task) {
        const taskDataToUse = {
            id: task.id,
            name: task.name,
            comment: task.comment,
            status: task.status,
            topic: task.topic,
        }

        selectedTask.value = taskDataToUse;
    } else {
        selectedTask.value = null;
    }

    dropdownOpen.value = false;
    emit("update", task);
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
    <div class="task-wrapper" v-if="tasks.data.length > 0">
        <div class="task-dropdown">
            <div class="dropdown-header" @click="dropdownOpen = !dropdownOpen" :class="{ shake: props.canShake }">
                <span class="truncate" style="--line-clamp: 1">
                    {{ selectedTask.value?.name || "Selecione uma tarefa para começar!" }}
                </span>
                <i :class="dropdownOpen ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"></i>
            </div>

            <Transition>
                <div v-if="dropdownOpen" class="dropdown-content">
                    <div class="dropdown-item" @click="selectTask(null)">---</div>
                    <div class="dropdown-item" v-for="task in tasks.data" :key="task.id" @click="selectTask(task)">
                        {{ task.name }}
                    </div>
                </div>
            </Transition>
        </div>

        <Task v-if="selectedTask.value?.id" :key="selectedTask.value.id" :task="selectedTask.value"
            @changeStatus="changeTaskStatus" @openComment="openTaskComment" :showPriorities="false" :showEdit="false"
            :showDelete="false" />

        <div v-else class="task alert">
            <p class="text">Sua tarefa aparecerá aqui...</p>
        </div>

        <Teleport to="#modal">
            <Transition>
                <CommentModal v-if="modal.show.value" @close="modal.hideModal" :comment="selectedComment"
                    id="comment-modal" />
            </Transition>
        </Teleport>
    </div>
    <div v-else class="alert">
        <p class="text text--icon">
            <i class="fa-solid fa-exclamation-circle"></i>
            <span> Crie uma nova tarefa para começar a utilizar o Pomodoro</span>
        </p>
    </div>

</template>

<style scoped>
.task-wrapper {
    display: flex;
    align-items: center;
    flex-direction: column;
    max-width: 500px;
    width: 90%;
}

.task-dropdown {
    position: relative;
    font-size: 1.6rem;
    color: var(--font-primary);
    width: 100%;
}

.dropdown-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
    padding: 1rem 1.6rem;
    border: 1px solid var(--border-color);
    background-color: var(--bg-primary);
    border-radius: var(--radius);
    cursor: pointer;
}

.dropdown-content {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    right: 0;
    border: 1px solid var(--border-color);
    background-color: var(--bg-secondary);
    border-radius: var(--radius);
    max-height: 150px;
    overflow-y: auto;
    z-index: 10;
}

.dropdown-item {
    padding: 1rem 1.6rem;
    cursor: pointer;
}

.dropdown-item:hover {
    background-color: #f0f0f0;
}

.task {
    margin-top: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
    flex-wrap: wrap;
    border: 1px solid var(--border-color);
    padding: 1.4rem var(--padding);
    border-radius: var(--radius);
    background-color: var(--bg-primary);
    transition: box-shadow 0.3s ease;
    width: 100%;
}

.task.alert {
    border-style: dashed;
    padding: 2.2rem var(--padding);
}

.alert {
    border-radius: var(--radius);
    background: var(--bg-secondary);
    padding: var(--padding);
    justify-content: center;
    cursor: default;
    opacity: .8;
}

.task__content {
    display: flex;
    align-items: center;
    gap: 2rem;

    .task__information {
        display: flex;
        align-items: flex-start;
        flex-direction: column;
    }
}

.shake {
    animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    transform: translate3d(0, 0, 0);
}

@keyframes shake {

    10%,
    90% {
        transform: translate3d(-1px, 0, 0);
    }

    20%,
    80% {
        transform: translate3d(2px, 0, 0);
    }

    30%,
    50%,
    70% {
        transform: translate3d(-4px, 0, 0);
    }

    40%,
    60% {
        transform: translate3d(4px, 0, 0);
    }
}
</style>

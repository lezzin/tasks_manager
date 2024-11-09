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
import { useTopic } from '../../composables/useTopic';
import UIButton from '../ui/UIButton.vue';

const emit = defineEmits(["update"]);

const props = defineProps({
    canShake: {
        type: Boolean,
        required: true
    }
});

const { changeStatus, getUserTasks } = useTask();
const { getTopicInfo } = useTopic();
const { showToast } = useToast();
const { user } = useAuthStore();
const loadingStore = useLoadingStore();
const router = useRouter();
const modal = useModal();

const tasks = reactive({ data: [] });
const dropdownOpen = ref(false);
const dropdownRef = ref(null);
const selectedTask = reactive({ value: null });
const selectedComment = ref("");

const loadTasks = async () => {
    loadingStore.showLoader();
    try {
        const data = await getUserTasks(user.uid);
        const userTasks = Object.values(data);

        await Promise.all(userTasks.map(async (task) => {
            const { name } = await getTopicInfo(task.topicId, user.uid);
            task.topicName = name;
        }));

        tasks.data = userTasks;
    } catch (error) {
        showToast("danger", error.message);
        if (error.code === "topic-not-found" || error.code === "doc-not-found") {
            router.push("/");
        }
    } finally {
        loadingStore.hideLoader();
    }
};

const toggleDropdown = () => {
    dropdownOpen.value = !dropdownOpen.value;
};

const handleChangeTaskStatus = async (taskToUpdate) => {
    try {
        const newStatus = await changeStatus(taskToUpdate, user.uid);
        taskToUpdate.status = newStatus;
        taskToUpdate.kanbanStatus = newStatus ? TASK_KANBAN_STATUSES.completed : TASK_KANBAN_STATUSES.todo;
        showToast("success", "Status de conclusão alterado com sucesso.");
    } catch (error) {
        showToast("danger", "Erro ao alterar status da tarefa.");
    }
};

const selectTask = (task) => {
    selectedTask.value = task;
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
    <div class="select-wrapper" v-if="tasks.data.length > 0">
        <div class="dropdown">
            <UIButton :class="['dropdown__header', { shake: props.canShake }]" @click="toggleDropdown"
                title="Abrir dropdown">
                <Task v-if="selectedTask.value?.id" :key="selectedTask.value.id" :task="selectedTask.value"
                    @changeStatus="handleChangeTaskStatus" :showPriorities="false" :showEdit="false" :showDelete="false"
                    :showCompletedStatus="false" :showComment="false" @openComment="openTaskComment" />

                <div v-else class="alert">
                    <p>Selecione uma tarefa para começar!</p>
                </div>

                <fa :icon="dropdownOpen ? 'chevron-up' : 'chevron-down'" />
            </UIButton>

            <Transition>
                <div v-if="dropdownOpen" ref="dropdownRef" class="dropdown__menu">
                    <UIButton class="dropdown__item" @click="selectTask(null)" title="Selecionar nenhuma tarefa">
                        ---
                    </UIButton>
                    <UIButton class="dropdown__item" v-for="task in tasks.data" :key="task.id" @click="selectTask(task)"
                        title="Selecionar tarefa">
                        <p>{{ task.name }}</p>
                        <p class="text text--smallest text--muted">{{ task.topicName }}</p>
                    </UIButton>
                </div>
            </Transition>
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
            <fa icon="exclamation-circle" />
            <span> Crie uma nova tarefa para começar a utilizar o Pomodoro</span>
        </p>
    </div>
</template>

<style scoped>
.select-wrapper {
    display: flex;
    align-items: center;
    flex-direction: column;
    max-width: 500px;
    color: var(--font-primary);
    width: 90%;
    min-height: 25dvh;
}

.dropdown {
    position: relative;
    font-size: 1.6rem;
    width: 100%;
}

.dropdown__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
    width: 100%;
    padding: 0 1.6rem 0 0;
    border: 1px solid var(--border-color);
    background-color: var(--bg-primary);
    border-radius: var(--radius);
}

.dropdown__header>:first-child {
    border-color: transparent;
    padding: 1rem;
    flex: 1;
}

.dropdown__menu {
    position: absolute;
    left: 0;
    right: 0;
    border: 1px solid var(--border-color);
    background-color: var(--bg-secondary);
    border-radius: var(--radius);
    max-height: 150px;
    overflow-y: auto;
    z-index: 10;
    top: calc(100% + 0.5rem);
}

.dropdown__item {
    width: 100%;
    padding: 1rem 1.6rem;
    cursor: pointer;
    background-color: inherit;
    text-align: left;
    border-radius: 0;
    flex-direction: column;
    align-items: flex-start;
}

.alert {
    color: var(--font-primary-light);
    padding: var(--padding);
    opacity: .7;
    padding: 2.32rem 2rem;
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

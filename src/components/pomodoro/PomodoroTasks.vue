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

import CommentModal from '../task/CommentModal';
import Task from '../task/TaskItem.vue';
import { useTopic } from '../../composables/useTopic';
import UIButton from '../ui/UIButton.vue';

const { changeStatus, getUserTasks } = useTask();
const { getTopicInfo } = useTopic();
const { showToast } = useToast();
const { user } = useAuthStore();
const loadingStore = useLoadingStore();
const router = useRouter();
const modal = useModal();

const tasks = reactive({ data: [] });
const isDropdownOpen = ref(false);
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

const toggleDropdown = () => {
    isDropdownOpen.value = !isDropdownOpen.value;
}

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
    <div class="pomodoro-tasks-wrapper">
        <p class="text text--icon" v-if="tasks.data.length === 0">
            <fa icon="exclamation-circle" />
            <span> Crie uma nova tarefa para começar a utilizar o Pomodoro</span>
        </p>

        <UIButton variant="outline-primary" @click="toggleDropdown" title="Exibir tarefas">
            <fa :icon="isDropdownOpen ? 'eye-slash' : 'eye'" />
            {{ isDropdownOpen ? 'Fechar' : 'Exibir' }} tarefas
        </UIButton>

        <Transition name="slide">
            <div class="task-nav" v-if="tasks.data.length > 0 && isDropdownOpen">
                <Task v-for="task in tasks.data" :key="task.id" :task="task" @changeStatus="handleChangeTaskStatus"
                    :showPriorities="false" :showEdit="false" :showDelete="false" :showCompletedStatus="false"
                    :showComment="true" @openComment="openTaskComment" variant="smaller" />
            </div>
        </Transition>
    </div>

    <Teleport to="#modal">
        <Transition>
            <CommentModal v-if="modal.show.value" @close="modal.hideModal" :comment="selectedComment"
                id="comment-modal" />
        </Transition>
    </Teleport>
</template>
<style scoped>
.pomodoro-tasks-wrapper {
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 1rem;
}

.task-nav {
    display: grid;
    gap: 0.6rem;
    max-height: 160px;
    overflow-y: auto;
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
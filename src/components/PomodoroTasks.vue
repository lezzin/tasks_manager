<script setup>
import { DOC_NAME, PAGE_TITLES, TASK_KANBAN_STATUSES } from '../utils/variables';
import { db } from '../libs/firebase';

import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { onMounted, reactive, ref, markRaw } from 'vue';
import { useRouter } from 'vue-router';
import { marked } from 'marked';

import { useAuthStore } from '../stores/authStore';
import { useLoadingStore } from '../stores/loadingStore';
import { useToast } from '../composables/useToast';
import { useModal } from '../composables/useModal';

import CommentModal from '../components/CommentModal.vue';

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
const router = useRouter();

const tasks = reactive({ data: [] });
const dropdownOpen = ref(false);
const selectedTask = reactive({ value: null });
const selectedComment = ref("");

const loadTasks = async () => {
    const docRef = doc(db, DOC_NAME, user.uid);
    loadingStore.showLoader();

    try {
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            showToast("error", "Documento não encontrado.");
            router.back("/");
            return;
        }

        const userData = docSnap.data();
        const topicsExists = userData && userData.topics && Object.keys(userData.topics).length > 0;

        if (!topicsExists) {
            showToast("error", "Adicione uma tarefa para utilizar o Método.");
            router.back("/");
            return;
        }

        tasks.data = extractUniqueTasks(userData.topics);

    } catch (error) {
        showToast("error", "Erro ao obter documento: " + error.message);
    }

    loadingStore.hideLoader();
};

const extractUniqueTasks = (userTopics) => {
    return (
        Object.values(userTopics)
            .flatMap(topic => topic.tasks || [])
            .filter((task, index, self) => index === self.findIndex((t) => t.id === task.id)));
}

const changeTaskStatus = async (taskToUpdate) => {
    const docRef = doc(db, DOC_NAME, user.uid);
    const newStatus = !taskToUpdate.status;

    try {
        const updatedTasks = tasks.data.map(task => task.id === taskToUpdate.id
            ? { ...task, status: newStatus, kanbanStatus: newStatus ? TASK_KANBAN_STATUSES.completed : TASK_KANBAN_STATUSES.todo }
            : task
        );

        await updateDoc(docRef, {
            [`topics.${taskToUpdate.topic.name}.${DOC_NAME}`]: updatedTasks
        });

        showToast("success", "Status de conclusão alterado com sucesso");
    } catch (error) {
        showToast("error", "Erro ao alterar tarefa: " + error.message);
    }

    taskToUpdate.status = newStatus;
    taskToUpdate.kanbanStatus = newStatus ? TASK_KANBAN_STATUSES.completed : TASK_KANBAN_STATUSES.todo;
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

        <div v-if="selectedTask.value?.id" class="task">
            <div class="task__content">
                <button :class="`btn btn--bordered btn--rounded ${selectedTask.value?.status ? 'btn--primary' : ''}`"
                    :title="`Marcar tarefa como ${selectedTask.value?.status ? 'não concluída' : 'concluída'}`"
                    @click="changeTaskStatus(selectedTask.value)" aria-label="Marcar tarefa como concluída">
                    <i class="fa-solid fa-check"></i>
                </button>

                <div class="task__information">
                    <p class="text text--small text--muted truncate" style="--line-clamp: 1">
                        {{ selectedTask.value?.topic.name }}
                    </p>
                    <p class="text truncate" style="--line-clamp: 1">
                        {{ selectedTask.value?.name }}
                    </p>
                </div>
            </div>

            <button @click="openTaskComment(selectedTask.value?.comment)" title="Abrir modal de comentário"
                class="btn btn--rounded btn--outline-primary" aria-haspopup="dialog" aria-controls="comment-modal"
                v-if="selectedTask.value?.comment">
                <span class="sr-only">Visualizar comentário da tarefa</span>
                <i class="fa-solid fa-comment" aria-hidden="true"></i>
            </button>
        </div>
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
    max-height: 200px;
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

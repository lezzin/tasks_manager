<script setup>
import { formatDate, getPriorityClass, getPriorityIcon, getPriorityText } from '../utils/functions';
import { DOC_NAME, TASK_KANBAN_STATUSES } from '../utils/variables';
import { db } from '../libs/firebase';

import { useToast } from '../composables/useToast';
import { useAuthStore } from '../stores/authStore';

import { doc, updateDoc } from 'firebase/firestore';
import { marked } from 'marked';
import { inject, ref } from 'vue';

import EditTaskForm from './EditTaskForm.vue';
import CommentModal from './CommentModal.vue';

const { user } = useAuthStore();
const { showToast } = useToast();

const filterTask = inject("filterTask");
const searchTask = inject("searchTask");

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

const isEditTaskModalActive = ref(false);
const editingTask = ref(null);

const isCommentModalActive = ref(false);
const selectedComment = ref(null);

const changeTaskStatus = async (taskId) => {
    const docRef = doc(db, DOC_NAME, user.uid);
    const taskToUpdate = props.tasks.find(task => task.id === taskId);
    if (taskToUpdate) {
        const newStatus = !taskToUpdate.status;

        await updateDoc(docRef, {
            [`topics.${props.topic}.${DOC_NAME}`]: props.tasks.map((task) =>
                task.id === taskId
                    ? { ...task, status: newStatus, kanbanStatus: newStatus ? TASK_KANBAN_STATUSES.completed : TASK_KANBAN_STATUSES.todo }
                    : task
            ),
        });

        showToast("success", "Status de conclusão alterado com sucesso");
        filterTask.value = "all";
        searchTask.value = "";
    }
};

const deleteTask = async (taskId) => {
    if (!confirm("Tem certeza que deseja excluir essa tarefa? Essa ação não poderá ser desfeita!")) return;

    const docRef = doc(db, DOC_NAME, user.uid);
    const updatedTasks = props.tasks.filter((task) => task.id !== taskId);

    await updateDoc(docRef, {
        [`topics.${props.topic}.${DOC_NAME}`]: updatedTasks,
    });

    showToast("success", "Tarefa excluída com sucesso");
};

const openEditTaskModal = (task) => {
    isEditTaskModalActive.value = true;
    editingTask.value = task;
};

const closeEditTaskModal = () => {
    isEditTaskModalActive.value = false;
    editingTask.value = null;
};

const openTaskComment = (comment) => {
    isCommentModalActive.value = true;
    selectedComment.value = marked(comment);
};

const closeCommentModal = () => {
    isCommentModalActive.value = false;
};
</script>

<template>
    <div class="task-nav">
        <div :class="`task ${task.status ? 'completed' : ''}`" v-for="task in props.tasks" :key="task.id">
            <div class="task__content">
                <button :class="`btn btn--bordered btn--rounded ${task.status ? 'btn--primary' : ''}`"
                    :title="`Marcar tarefa como ${task.status ? 'não concluída' : 'concluída'}`"
                    @click="changeTaskStatus(task.id)">
                    <i class="fa-solid fa-check"></i>
                </button>
                <div class="task__information">
                    <p class="text">{{ task.name }}</p>
                    <p class="task__information__bottom">
                        <span :class="['tag', getPriorityClass(task.priority)]">
                            <i :class="getPriorityIcon(task.priority)"></i>
                            {{ getPriorityText(task.priority) }}
                        </span>
                        <span class="text text--icon text--small text--muted">
                            <i class="fa-regular fa-clock"></i>
                            Criado em: {{ task.created_at }}
                        </span>
                        <span class="text text--icon text--small text--muted" v-if="task.delivery_date">
                            <i class="fa-regular fa-bell"></i>
                            Entrega para: {{ formatDate(task.delivery_date) }}
                        </span>
                    </p>
                </div>
            </div>
            <div class="task__action">
                <button class="btn btn--rounded btn--primary" title="Visualizar comentários da tarefa"
                    @click="openTaskComment(task.comment)" v-if="task.comment">
                    <span class="fa-solid fa-comment"></span>
                </button>
                <button class="btn btn--rounded btn--primary" title="Editar tarefa" @click="openEditTaskModal(task)">
                    <span class="fa-solid fa-pen"></span>
                </button>
                <button class="btn btn--rounded btn--danger" title="Excluir tarefa" @click="deleteTask(task.id)">
                    <span class="fa-solid fa-trash"></span>
                </button>
            </div>
        </div>
        <p class="text text--center" v-if="props.tasks.length === 0">
            Nenhuma tarefa para esse filtro
        </p>
    </div>

    <EditTaskForm :isActive="isEditTaskModalActive" @close="closeEditTaskModal" :topic="props.topic"
        :task="editingTask" />
    <CommentModal :isActive="isCommentModalActive" @close="closeCommentModal" :comment="selectedComment" />
</template>

<style scoped>
.task-nav {
    display: grid;
    gap: 0.6rem;
    padding-bottom: 5rem;

    .task {
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

        .task__content {
            display: flex;
            align-items: center;
            gap: 2rem;

            .task__information {
                display: flex;
                align-items: flex-start;
                flex-direction: column;
                gap: 0.4rem;

                >.text {
                    font-size: 2rem;
                }

                .tag {
                    border-radius: calc(var(--radius) * 1.8);
                }

                .task__information__bottom {
                    display: flex;
                    align-items: center;
                    gap: 1rem;

                    @media (width <=768px) {
                        align-items: flex-start;
                        flex-direction: column;
                        gap: 0.3rem;
                    }
                }
            }
        }

        .task__action {
            display: flex;
            gap: 1rem;

            @media (width <=768px) {
                margin-left: auto;
            }
        }
    }
}
</style>

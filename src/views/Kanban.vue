<script setup>
import { DOC_NAME, PAGE_TITLES, TASK_KANBAN_STATUSES } from '../utils/variables.js';
import { getPriorityClass, getPriorityText, getPriorityIcon } from '../utils/priorityUtils.js';

import { ref, reactive, onMounted, inject } from 'vue';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { RouterLink, useRouter } from 'vue-router';

import { useAuthStore } from '../stores/authStore';
import { useLoadingStore } from '../stores/loadingStore.js';

import Image from '../components/Image.vue';

const props = defineProps(['db']);

const tasks = reactive({
    todo: [],
    doing: [],
    completed: [],
});
const draggedTask = ref(null);
const activeColumn = ref(null);
const tasksLength = ref(0);

const { user } = useAuthStore();
const loadingStore = useLoadingStore();
const router = useRouter();

const sendBack = () => {
    router.back();
};

const createTaskObject = ({ name, id }, task) => {
    return {
        topic_name: name,
        topic_id: id,
        ...task,
    };
};

const getUserTasks = (topics) => {
    return Object.values(topics)
        .filter((topic) => topic.tasks?.length > 0)
        .flatMap((topic) => topic.tasks.map((task) => createTaskObject(topic, task)));
};

const getAllUserTasks = async () => {
    loadingStore.showLoader();

    try {
        const userData = await fetchUserData();
        if (!userData?.topics || Object.keys(userData.topics).length === 0) {
            return;
        }

        const userTasks = getUserTasks(userData.topics);
        tasksLength.value = userTasks.length;

        organizeTasksByStatus(userTasks);
    } catch (error) {
        showToast("error", `Erro ao resgatar tarefas: ${error.message}`);
    } finally {
        loadingStore.hideLoader();
    }
};

const fetchUserData = async () => {
    const docRef = doc(props.db, DOC_NAME, user.uid);
    const docSnap = await getDoc(docRef);
    return docSnap.data();
};

const organizeTasksByStatus = (userTasks) => {
    tasks.todo = userTasks.filter((task) => task.kanbanStatus === TASK_KANBAN_STATUSES.todo || !task.kanbanStatus);
    tasks.doing = userTasks.filter((task) => task.kanbanStatus === TASK_KANBAN_STATUSES.doing);
    tasks.completed = userTasks.filter((task) => task.kanbanStatus === TASK_KANBAN_STATUSES.completed);
};

const handleDragEvents = (event, action, task = null) => {
    if (action === "start") {
        draggedTask.value = task;
        event.target.classList.add("dragging");
    } else if (action === "end") {
        event.target.classList.remove("dragging");
        draggedTask.value = null;
    }
};

const onDrop = (column) => {
    if (draggedTask.value && draggedTask.value.kanbanStatus !== column) {
        changeTaskColumn(draggedTask.value, column);
    }
    draggedTask.value = null;
    activeColumn.value = null;
};

const onDragEnter = (event, kanbanStatus) => {
    if (activeColumn.value !== kanbanStatus) {
        activeColumn.value = kanbanStatus;
    }
    event.preventDefault();
};

const onDragOver = (event) => {
    event.preventDefault();
};

const moveTask = (task, direction) => {
    const newColumn = getNewColumn(task.kanbanStatus, direction);
    if (newColumn) {
        changeTaskColumn(task, newColumn);
    }
};

const getNewColumn = (currentColumn, direction) => {
    const columns = ["todo", "doing", "completed"];
    const currentIndex = columns.indexOf(currentColumn);
    return direction === "prev" && currentIndex > 0 ? columns[currentIndex - 1] :
        direction === "next" && currentIndex < columns.length - 1 ? columns[currentIndex + 1] : null;
};

const isFirstColumn = (kanbanStatus) => {
    return kanbanStatus === 'todo';
};

const isLastColumn = (kanbanStatus) => {
    return kanbanStatus === 'completed';
};

const changeTaskColumn = (task, newColumn) => {
    task.kanbanStatus = newColumn;
    tasks.todo = tasks.todo.filter((t) => t !== task);
    tasks.doing = tasks.doing.filter((t) => t !== task);
    tasks.completed = tasks.completed.filter((t) => t !== task);
    tasks[newColumn].push(task);
    updateTaskStatus(task, newColumn);
};

const updateTaskStatus = async (taskToUpdate, newKanbanStatus) => {
    try {
        const userData = await fetchUserData();
        if (userData?.topics) {
            const selectedTopicData = Object.values(userData.topics).find(
                (topic) => topic.id === taskToUpdate.topic_id
            );

            if (selectedTopicData?.tasks) {
                const updatedTasks = selectedTopicData.tasks.map((task) => {
                    if (taskToUpdate.id === task.id) {
                        taskToUpdate.kanban = newKanbanStatus;
                        taskToUpdate.status = newKanbanStatus === TASK_KANBAN_STATUSES.completed;

                        return {
                            ...task,
                            kanbanStatus: newKanbanStatus,
                            status: newKanbanStatus === TASK_KANBAN_STATUSES.completed
                        };
                    }
                    return task;
                });

                await updateDoc(doc(props.db, DOC_NAME, user.uid), {
                    [`topics.${selectedTopicData.name}.${DOC_NAME}`]: updatedTasks,
                });
            }
        }
    } catch (error) {
        showToast("error", `Erro ao atualizar status da tarefa: ${error.message}`);
    }
};

onMounted(() => {
    document.title = PAGE_TITLES.kanban;
    inject('showTopicNavBtn').value = false;
    getAllUserTasks();
});
</script>

<template>
    <div class="kanban-wrapper container" v-if="tasksLength > 0">
        <div class="kanban-wrapper__header">
            <h2 class="title">Visualize as suas tarefas em formato Kanban</h2>
            <button @click="sendBack" class="btn btn--outline-primary btn--icon" title="Voltar para o início">
                <i class="fa-solid fa-arrow-left"></i>
                Voltar para o início
            </button>
        </div>

        <div class="kanban">
            <div class="kanban__column" v-for="kanbanStatus in ['todo', 'doing', 'completed']" :key="kanbanStatus"
                :class="{ 'drag-over': activeColumn === kanbanStatus }" @drop="onDrop(kanbanStatus)"
                @dragover="onDragOver" @dragenter="event => onDragEnter(event, kanbanStatus)"
                :data-status="kanbanStatus">
                <h2 class="subtitle">
                    {{ kanbanStatus === 'todo' ? 'Para fazer' : kanbanStatus === 'doing' ? 'Em andamento' : 'Concluído'
                    }}
                </h2>

                <div class="kanban__tasks">
                    <div class="task task--empty" v-if="tasks[kanbanStatus].length === 0">
                        <i class="fa-solid fa-box-open"></i>
                        <p class="text text--bold">Nenhuma tarefa na coluna</p>
                    </div>
                    <div v-else v-for="task in tasks[kanbanStatus]" :key="task.id"
                        :class="['task', task.status && 'completed']" draggable="true"
                        @dragstart="handleDragEvents($event, 'start', task)" @dragend="handleDragEvents($event, 'end')">

                        <p class="text text--small text--muted">
                            {{ task.topic_name }}
                        </p>

                        <RouterLink class="text text--bold truncate" :to="'/topic/' + task.topic_id"
                            style="--line-clamp: 1">
                            {{ task.name }}
                        </RouterLink>

                        <span :class="['tag', getPriorityClass(task.priority)]">
                            <i :class="getPriorityIcon(task.priority)"></i>
                            {{ getPriorityText(task.priority) }}
                        </span>

                        <div class="task__navigation">
                            <button type="button" class="btn btn--outline-primary" @click="moveTask(task, 'prev')"
                                :disabled="isFirstColumn(kanbanStatus)">
                                ← Anterior
                            </button>
                            <button type="button" class="btn btn--outline-primary" @click="moveTask(task, 'next')"
                                :disabled="isLastColumn(kanbanStatus)">
                                Próximo →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="container" v-else>
        <RouterLink to="/" title="Voltar para o início">
            <Image small="task_empty_sm.png" lg="task_empty_lg.png"
                alt="Frase tarefas vazias e uma imagem de uma caixa vazia" />
        </RouterLink>
    </div>
</template>

<style scoped>
.kanban-wrapper {
    padding: var(--padding) 0;

    .kanban-wrapper__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--padding);
        width: 100%;

        button {
            padding: 0.5rem 1rem;
        }
    }

    .kanban {
        display: grid;
        grid-template-columns: repeat(3, minmax(300px, 1fr));
        gap: 1rem;

        .kanban__column {
            border: 1px dashed transparent;

            &.drag-over>.subtitle {
                border-bottom-color: var(--details-color);
            }

            >.subtitle {
                border-bottom: 3px solid transparent;
                margin-bottom: 0.6rem;
                position: sticky;
                font-size: 1.4rem;
                top: calc(10vh - 1px);
                padding: 1rem var(--padding);
                background-color: var(--bg-secondary);
                z-index: 1;
                transition: border-bottom-color var(--screen-transition) ease;
            }

            .kanban__tasks {
                border: 1px solid transparent;
                border-radius: var(--radius);
                display: flex;
                flex-direction: column;
                gap: 1rem;
                padding-inline: var(--padding);

                .task {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 1rem;
                    border: 1px solid var(--border-color);
                    padding: 1.4rem var(--padding);
                    border-radius: var(--radius);
                    background-color: transparent;
                    transition: all 0.3s ease;
                    cursor: move;

                    &.dragging {
                        border-style: dashed;
                        opacity: .6;
                    }

                    &:not(.task--empty) {
                        box-shadow: var(--shadow-sm);
                    }

                    &.task--empty {
                        cursor: not-allowed;
                        align-items: center;
                        justify-content: center;
                        border-style: dashed;
                        font-size: 1.8rem;
                        gap: 0.5rem;
                        padding: 3.1879rem 0;
                    }

                    a.text {
                        text-decoration: none;
                    }

                    .tag {
                        border-radius: calc(var(--radius) * 2);
                    }

                    .task__navigation {
                        display: none;
                        justify-content: space-between;
                        align-items: center;
                        margin-top: 1.5rem;
                        gap: 0.5rem;
                        width: 100%;

                        @media (width<=768px) {
                            display: flex;
                        }

                        .btn {
                            font-size: 1.4rem;
                            padding: 0.4rem 0.8rem;
                        }
                    }
                }
            }
        }
    }
}
</style>
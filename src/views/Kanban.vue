<script setup>
import { DOC_NAME, PAGE_TITLES, TASK_KANBAN_STATUSES } from '../utils/variables.js';
import { formatDate, getPriorityClass, getPriorityText, getPriorityIcon } from '../utils/functions.js';
import { ref, reactive, onMounted, inject } from 'vue';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const props = defineProps(['db']);

const tasks = reactive({
    todo: [],
    doing: [],
    completed: [],
});
const draggedTask = ref(null);
const activeColumn = ref(null);
const tasksLength = ref(0);
const loadedTasks = ref(false);

const { user } = useAuthStore();
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
    try {
        const userData = await fetchUserData();
        if (!userData?.topics || Object.keys(userData.topics).length === 0) {
            loadedTasks.value = true;
            return;
        }

        const userTasks = getUserTasks(userData.topics);
        tasksLength.value = userTasks.length;

        organizeTasksByStatus(userTasks);
    } catch (error) {
        showToast("error", `Erro ao resgatar tarefas: ${error.message}`);
    } finally {
        loadedTasks.value = true;
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
    <div v-if="loadedTasks" id="kanban-page-container">
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
                        {{ kanbanStatus === 'todo' ? 'Para fazer' : kanbanStatus === 'doing' ? 'Fazendo' : 'Concluído'
                        }}
                    </h2>

                    <div class="kanban__tasks">
                        <div class="task task--empty" v-if="tasks[kanbanStatus].length === 0">
                            <i class="fa-solid fa-box-open"></i>
                            <p class="text text--bold">Nenhuma tarefa na coluna</p>
                        </div>
                        <div v-else v-for="task in tasks[kanbanStatus]" :key="task.id"
                            :class="['task', task.status && 'completed']" draggable="true"
                            @dragstart="handleDragEvents($event, 'start', task)"
                            @dragend="handleDragEvents($event, 'end')">
                            <router-link class="text text--bold truncate" :to="'/topic/' + task.topic_id"
                                style="--line-clamp: 1">
                                {{ task.name }}
                            </router-link>

                            <span :class="['tag', getPriorityClass(task.priority)]">
                                <i :class="getPriorityIcon(task.priority)"></i>
                                {{ getPriorityText(task.priority) }}
                            </span>

                            <div class="task__information">
                                <span class="text text--icon text--small text--muted">
                                    <i class="fa-regular fa-clock"></i>
                                    Criado em: {{ task.created_at }}
                                </span>
                                <span class="text text--icon text--small text--muted" v-if="task.delivery_date">
                                    <i class="fa-regular fa-bell"></i>
                                    Entrega para: {{ formatDate(task.delivery_date) }}
                                </span>
                            </div>

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
    </div>
    <div class="container" v-else>
        <router-link to="/" title="Voltar para o início">
            <img src="/src/assets/img/task_empty_lg.png" alt="Frase tarefas vazias e uma imagem de uma caixa vazia"
                class="large-screen" loading="lazy" />
            <img src="/src/assets/img/task_empty_sm.png" alt="Frase tarefas vazias e uma imagem de uma caixa vazia"
                class="small-screen" width="640" height="640" loading="lazy" />
        </router-link>
    </div>
</template>

<style scoped>
#kanban-page-container {
    .kanban-wrapper {
        overflow-x: auto;

        display: grid;
        grid-template-rows: 10vh 80vh;

        .kanban-wrapper__header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;

            button {
                padding: 0.5rem 1rem;
            }
        }

        .kanban {
            display: grid;
            grid-template-columns: repeat(3, minmax(300px, 1fr));
            padding-bottom: calc(var(--padding) * 2);
            gap: 1rem;

            .kanban__column {
                border: 1px dashed transparent;
                overflow-y: auto;
                height: 100%;

                &.drag-over {
                    position: relative;
                    border-color: var(--border-color);
                    border-radius: var(--radius);

                    &::after {
                        content: "";
                        position: absolute;
                        inset: 0;
                        pointer-events: none;
                        background: rgb(0 0 0 / 0.075);
                        z-index: 2;
                    }
                }

                >.subtitle {
                    margin-bottom: 0.6rem;
                    padding-left: var(--padding);
                    position: sticky;
                    top: 0;
                    padding: var(--padding);
                    background-color: var(--bg-secondary);
                    z-index: 1;
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
                            transform: scale(1.05);
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
                        }

                        a.text {
                            text-decoration: none;
                        }

                        .tag {
                            border-radius: calc(var(--radius) * 2);
                        }

                        .task__information {
                            display: flex;
                            flex-direction: column;
                            margin-top: 1.5rem;
                            gap: 0.5rem;
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
}
</style>
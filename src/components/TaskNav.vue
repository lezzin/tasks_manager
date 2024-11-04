<script setup>
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthUser } from '../composables/useAuthUser';
import { db } from '../libs/firebase';
import { formatDate, getPriorityClass, getPriorityIcon, getPriorityText } from '../utils/functions';
import { DOC_NAME, TASK_KANBAN_STATUSES } from '../utils/variables';
import { useToast } from '../composables/useToast';

const { user } = useAuthUser();
const { showToast } = useToast();

const getUserData = async (docRef) => {
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
};

const props = defineProps({
    topic: {
        type: Object,
        required: true
    }
});

const changeTaskStatus = async (taskId) => {
    const docRef = doc(db, DOC_NAME, user.value.uid);
    const userData = await getUserData(docRef);

    if (userData && userData.topics) {
        const selectedTopicData = userData.topics[props.topic.name];

        if (selectedTopicData && selectedTopicData.tasks) {
            const updatedTasks = selectedTopicData.tasks.map((task) => {
                const newStatus = !task.status;

                if (task.id == taskId) {
                    return {
                        ...task,
                        status: newStatus,
                        kanbanStatus: newStatus ? TASK_KANBAN_STATUSES.completed : TASK_KANBAN_STATUSES.todo,
                    };
                }
                return task;
            });

            await updateDoc(docRef, {
                [`topics.${props.topic.name}.${DOC_NAME}`]: updatedTasks,
            });

            showToast("success", "Status de conclusão alterado com sucesso");
        }
    }
};

const deleteTask = async (topicName, taskId) => {
    if (!confirm("Tem certeza que deseja excluir essa tarefa? Essa ação não poderá ser desfeita!"))
        return;

    const docRef = doc(db, DOC_NAME, user.value.uid);
    const userData = await getUserData(docRef);

    if (!userData || !userData.topics || !userData.topics[topicName]) {
        showToast("error", "Tópico não encontrado");
        return;
    }

    const selectedTopic = userData.topics[topicName];
    const updatedTasks = selectedTopic.tasks.filter((task) => task.id !== taskId);

    await updateDoc(docRef, {
        [`topics.${topicName}.${DOC_NAME}`]: updatedTasks,
    });

    showToast("success", "Tarefa excluída com sucesso");
};
</script>

<template>
    <div class="task-nav">
        <div :class="`task ${task.status && 'completed'}`" v-for="task in props.topic.tasks">
            <div class="task__content">
                <button :class="`btn btn--bordered btn--rounded ${task.status && 'btn--primary'}`"
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
                <button class="btn btn--rounded btn--primary" title="Editar tarefa" @click="openEditTask(task)">
                    <span class="fa-solid fa-pen"></span>
                </button>
                <button class="btn btn--rounded btn--danger" title="Excluir tarefa"
                    @click="deleteTask(props.topic.name, task.id)">
                    <span class="fa-solid fa-trash"></span>
                </button>
            </div>
        </div>
        <p class="text text--center" v-if="props.topic.tasks.length === 0">
            Nenhuma tarefa para esse filtro
        </p>
    </div>
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

        &.priority-high:not(.completed) .task__content>button {
            background-color: var(--task-priority-medium);
        }

        &.priority-medium :not(.completed) .task__content>button {
            background-color: var(--task-priority-low);
        }

        .task:hover {
            box-shadow: var(--shadow-md);
        }

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
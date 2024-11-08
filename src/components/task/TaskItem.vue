<script setup>
import { getPriorityClass, getPriorityIcon, getPriorityText } from '../../utils/priorityUtils';
import { formatDate } from '../../utils/dateUtils';

const emit = defineEmits(["changeStatus", "openComment", "edit", "delete"]);

const props = defineProps({
    task: {
        type: Object,
        default: null
    },
    showPriorities: {
        type: Boolean,
        default: true
    },
    showEdit: {
        type: Boolean,
        default: true
    },
    showDelete: {
        type: Boolean,
        default: true
    },
    showComments: {
        type: Boolean,
        default: true
    }
});

const changeTaskStatus = (task) => emit("changeStatus", task);
const openTaskComment = (comment) => emit("openComment", comment);
const openEditTaskModal = (task) => emit("edit", task);
const deleteTask = (task) => emit("delete", task);
</script>

<template>
    <div :class="`task ${props.task.status ? 'completed' : ''}`">
        <div class="task__content">
            <button :class="`btn btn--bordered btn--rounded ${props.task.status ? 'btn--primary' : ''}`"
                :title="`Marcar tarefa como ${props.task.status ? 'não concluída' : 'concluída'}`"
                @click="changeTaskStatus(props.task)" aria-label="Marcar tarefa como concluída">
                <i class="fa-solid fa-check"></i>
            </button>
            <div class="task__information">
                <p class="text">{{ props.task.name }}</p>
                <p class="task__information__bottom" v-if="props.showPriorities">
                    <span :class="['tag', getPriorityClass(props.task.priority)]">
                        <i :class="getPriorityIcon(props.task.priority)"></i>
                        {{ getPriorityText(props.task.priority) }}
                    </span>
                    <span class="text text--icon text--small text--muted">
                        <i class="fa-regular fa-clock"></i>
                        Criado em: {{ props.task.created_at }}
                    </span>
                    <span class="text text--icon text--small text--muted" v-if="props.task.delivery_date">
                        <i class="fa-regular fa-bell"></i>
                        Entrega para: {{ formatDate(props.task.delivery_date) }}
                    </span>
                </p>
            </div>
        </div>
        <div class="task__action">
            <button v-if="props.showComments && props.task.comment" class="btn btn--rounded btn--primary"
                title="Visualizar comentários da tarefa" @click="openTaskComment(props.task.comment)"
                aria-label="Visualizar comentários da tarefa">
                <span class="fa-solid fa-comment"></span>
            </button>
            <button v-if="props.showEdit" class="btn btn--rounded btn--primary" title="Editar tarefa"
                @click="openEditTaskModal(props.task)" aria-label="Editar tarefa">
                <span class="fa-solid fa-pen"></span>
            </button>
            <button v-if="props.showDelete" class="btn btn--rounded btn--danger" title="Excluir tarefa"
                @click="deleteTask(props.task)" aria-label="Excluir tarefa">
                <span class="fa-solid fa-trash"></span>
            </button>
        </div>
    </div>
</template>

<style scoped>
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
</style>
<script setup>
import { getPriorityClass, getPriorityIcon, getPriorityText } from '../../utils/priorityUtils';
import { formatDate } from '../../utils/dateUtils';
import UIButton from '../ui/UIButton.vue';

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
    },
    showCompletedStatus: {
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
    <div :class="`task ${props.task.status && props.showCompletedStatus ? 'completed' : ''}`">
        <div class="task__content">
            <UIButton isBordered isRounded :variant="props.task.status ? 'primary' : ''"
                :title="`Marcar tarefa como ${props.task.status ? 'não concluída' : 'concluída'}`"
                @click.stop="changeTaskStatus(props.task)">
                <fa icon="check" />
            </UIButton>
            <div class="task__information">
                <p class="text truncate" style="--line-clamp: 1">{{ props.task.name }}</p>
                <p class="task__information__bottom" v-if="props.showPriorities">
                    <span :class="['tag', getPriorityClass(props.task.priority)]">
                        <fa :icon="getPriorityIcon(props.task.priority)" />
                        {{ getPriorityText(props.task.priority) }}
                    </span>
                    <span class="text text--icon text--small text--muted">
                        <fa icon="clock" />
                        Criado em: {{ props.task.created_at }}
                    </span>
                    <span class="text text--icon text--small text--muted" v-if="props.task.delivery_date">
                        <fa icon="bell" />
                        Entrega para: {{ formatDate(props.task.delivery_date) }}
                    </span>
                </p>
            </div>
        </div>
        <div class="task__action"
            v-if="(props.showComments && props.task.comment) || props.showEdit || props.showDelete">
            <UIButton variant="primary" isRounded title="Visualizar comentários da tarefa"
                @click.stop="openTaskComment(props.task.comment)" v-if="props.showComments && props.task.comment">
                <fa icon="comment" />
            </UIButton>
            <UIButton variant="primary" isRounded title="Editar tarefa" @click.stop="openEditTaskModal(props.task)"
                aria-label="Editar tarefa" v-if="props.showEdit">
                <fa icon="pen" />
            </UIButton>
            <UIButton variant="danger" isRounded title="Excluir tarefa" @click="deleteTask(props.task)"
                v-if="props.showDelete">
                <fa icon="trash" />
            </UIButton>
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
    text-align: left;
}

.task__content {
    display: flex;
    align-items: center;
    gap: 2rem;

}

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

.task__action {
    display: flex;
    gap: 1rem;

    @media (width <=768px) {
        margin-left: auto;
    }
}
</style>
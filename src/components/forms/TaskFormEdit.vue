<script setup>
import { TASK_PRIORITIES } from '../../utils/variables';

import { ref, watch } from 'vue';

import { useToast } from '../../composables/useToast';
import { useAuthStore } from '../../stores/authStore';

import InputRecognition from '../utilities/InputRecognition.vue';
import MarkdownEditor from '../utilities/MarkdownEditor.vue';
import { useTask } from '../../composables/useTask';

const emit = defineEmits(["close"]);

const props = defineProps({
    topic: {
        type: String,
        required: false
    },
    task: {
        type: Object,
        required: false
    },
});

const { user } = useAuthStore();
const { editTask } = useTask();
const { showToast } = useToast();

const taskName = ref("");
const taskNameError = ref("");
const taskPriority = ref(TASK_PRIORITIES.low);
const taskDate = ref(null);
const taskDateError = ref(null);
const taskComment = ref("");

const setTaskData = () => {
    taskName.value = props.task?.name || "";
    taskPriority.value = props.task?.priority || TASK_PRIORITIES.low;
    taskDate.value = props.task?.delivery_date || null;
    taskComment.value = props.task?.comment || "";
};

watch(() => props.task, setTaskData, { immediate: true });

const updateTaskName = (value) => {
    taskName.value = value;
    taskNameError.value = '';
};

const updateTaskComment = (value) => {
    taskComment.value = value;
};

const handleEditTask = async () => {
    try {
        await editTask(props.task, taskName.value, taskComment.value, taskPriority.value, taskDate.value, user.uid);
        showToast("success", "Tarefa alterada com sucesso");
        closeEditTaskModal();
    } catch (error) {
        console.error(error);

        const errors = {
            "empty-name": () => (taskNameError.value = error.message),
            "invalid-date": () => (taskDateError.value = error.message),
        }

        errors[error.code] ? errors[error.code]() : showToast("danger", "Erro desconhecido. Tente novamente mais tarde.");
    }
};

const closeEditTaskModal = () => {
    taskName.value = "";
    taskNameError.value = "";
    taskPriority.value = TASK_PRIORITIES.low;
    taskDate.value = null;
    taskComment.value = "";
    emit("close");
};

watch(taskDate, () => (taskDateError.value = ""));
</script>

<template>
    <aside class="modal" role="dialog" aria-modal="true" aria-labelledby="edit-task-title">
        <div class="modal__dialog">
            <div class="modal__header">
                <h2 id="edit-task-title" class="modal__title">Editar tarefa</h2>
                <button class="btn" @click="closeEditTaskModal" title="Fechar modal"
                    aria-label="Fechar modal de edição de tarefa">
                    <i class="fa-solid fa-times" aria-hidden="true"></i>
                </button>
            </div>

            <form @submit.prevent="handleEditTask">
                <InputRecognition label="Nome da tarefa" placeholder="Editar tarefa..." v-model:modelValue="taskName"
                    :errorMessage="taskNameError" enableVoiceRecognition inputId="edit-task-name"
                    @update="updateTaskName" />

                <div :class="['form-group', taskDateError ? 'input-error' : '']">
                    <label class="text" for="edit-task-date">Data de entrega (opcional)</label>
                    <input type="date" id="edit-task-date" v-model="taskDate" />
                    <p class="text text--error" v-if="taskDateError">{{ taskDateError }}</p>
                </div>

                <MarkdownEditor label="Comentários (opcional)" v-model:modelValue="taskComment"
                    @update="updateTaskComment" aria-label="Comentários sobre a tarefa" />

                <div class="form-group">
                    <label class="text" for="edit-task-priority">Prioridade</label>
                    <div class="select">
                        <select id="edit-task-priority" v-model="taskPriority"
                            aria-label="Selecionar prioridade da tarefa">
                            <option value="1">Baixa</option>
                            <option value="2">Média</option>
                            <option value="3">Alta</option>
                        </select>
                    </div>
                </div>

                <button type="submit" class="btn btn--primary btn--block" title="Concluir edição da tarefa"
                    aria-label="Salvar edição da tarefa">
                    <i class="fa-solid fa-check" aria-hidden="true"></i> Concluir edição
                </button>
            </form>
        </div>
    </aside>
</template>

<script setup>
import { TASK_PRIORITIES } from '../../utils/variables';

import { inject, ref, watch } from 'vue';

import InputRecognition from '../utilities/InputRecognition.vue';
import MarkdownEditor from '../utilities/MarkdownEditor.vue';

import { useToast } from '../../composables/useToast';
import { useTask } from '../../composables/useTask';
import { useAuthStore } from '../../stores/authStore';
import UIButton from '../ui/UIButton.vue';
import UIModal from '../ui/UIModal.vue';

const props = defineProps({
    topicId: {
        type: String,
        default: "",
    }
});

const emit = defineEmits(["close"]);

const { user } = useAuthStore();
const { showToast } = useToast();
const { addTask } = useTask();

const filterTask = inject("filterTask");
const searchTask = inject("searchTask");

const taskName = ref("");
const taskNameError = ref("");
const taskPriority = ref(TASK_PRIORITIES.low);
const taskDate = ref("");
const taskDateError = ref("");
const taskComment = ref("");

const closeAddingTask = () => {
    taskName.value = "";
    taskDate.value = "";
    taskComment.value = "";
    taskPriority.value = TASK_PRIORITIES.low;

    filterTask.value = "all";
    searchTask.value = "";

    emit("close");
};

const updateTaskName = (value) => {
    taskName.value = value;
    taskNameError.value = "";
};

const updateTaskComment = (value) => {
    taskComment.value = value;
};

const handleAddTask = async () => {
    try {
        await addTask(props.topicId, taskName.value, taskComment.value, taskPriority.value, taskDate.value, user.uid);
        closeAddingTask();
        showToast("success", "Tarefa adicionada com sucesso.")
    } catch (error) {
        const errors = {
            "empty-name": () => (taskNameError.value = error.message),
            "invalid-date": () => (taskDateError.value = error.message),
        }

        errors[error.code] ? errors[error.code]() : showToast("danger", "Erro desconhecido. Tente novamente mais tarde.");
    }
};

watch(taskDate, () => (taskDateError.value = ""));
</script>

<template>
    <UIModal @close="closeAddingTask" titleId="add-task-modal-title">
        <template #title>Adicionar tarefa</template>
        <template #body>
            <form @submit.prevent="handleAddTask" aria-describedby="modal-add-task-title">
                <InputRecognition label="Nome da tarefa" placeholder="Adicionar tarefa..." v-model:modelValue="taskName"
                    :errorMessage="taskNameError" enableVoiceRecognition inputId="add-task-name"
                    @update="updateTaskName" />

                <div :class="['form-group', taskDateError ? 'input-error' : '']">
                    <label class="text" for="add-task-date">Data de entrega (opcional)</label>
                    <input type="date" v-model="taskDate" id="add-task-date" aria-describedby="add-task-date-help" />
                    <small id="add-task-date-help" class="sr-only">Selecione uma data, se houver.</small>
                    <p class="text text--error" v-if="taskDateError">{{ taskDateError }}</p>
                </div>

                <MarkdownEditor label="Comentários (opcional)" v-model:modelValue="taskComment"
                    @update="updateTaskComment" />

                <div class="form-group">
                    <label class="text" for="edit-task-priority">Prioridade</label>
                    <div class="select">
                        <select id="edit-task-priority" v-model="taskPriority" aria-label="Selecionar prioridade">
                            <option value="1">Baixa</option>
                            <option value="2">Média</option>
                            <option value="3">Alta</option>
                        </select>
                    </div>
                </div>

                <UIButton type="submit" variant="primary" title="Concluir adição da tarefa">
                    <fa icon="check" /> Adicionar tarefa
                </UIButton>
            </form>
        </template>
    </UIModal>
</template>
<script setup>
import { TASK_PRIORITIES } from "../../utils/variables";

import { ref, watch } from "vue";

import { useToast } from "../../composables/useToast";
import { useAuthStore } from "../../stores/authStore";

import InputRecognition from "../utilities/InputRecognition.vue";
import MarkdownEditor from "../utilities/MarkdownEditor.vue";
import { useTask } from "../../composables/useTask";
import UIButton from "../ui/UIButton.vue";
import UIModal from "../ui/UIModal.vue";

const emit = defineEmits(["close"]);

const props = defineProps({
    topic: {
        type: String,
        required: false,
    },
    task: {
        type: Object,
        required: false,
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
    taskNameError.value = "";
};

const updateTaskComment = (value) => {
    taskComment.value = value;
};

const handleEditTask = async () => {
    try {
        await editTask(
            props.task,
            taskName.value,
            taskComment.value,
            taskPriority.value,
            taskDate.value,
            user.uid
        );
        showToast("success", "Tarefa alterada com sucesso.");
        closeEditTaskModal();
    } catch (error) {
        const errors = {
            "empty-name": () => (taskNameError.value = error.message),
            "invalid-date": () => (taskDateError.value = error.message),
        };

        errors[error.code]
            ? errors[error.code]()
            : showToast("danger", "Erro desconhecido. Tente novamente mais tarde.");
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
    <UIModal @close="closeEditTaskModal" titleId="edit-task-modal-title">
        <template #title>Editar tarefa</template>

        <template #body>
            <form @submit.prevent="handleEditTask">
                <InputRecognition
                    label="Nome da tarefa"
                    placeholder="Editar tarefa..."
                    v-model:modelValue="taskName"
                    :errorMessage="taskNameError"
                    enableVoiceRecognition
                    inputId="edit-task-name"
                    @update="updateTaskName"
                />

                <div :class="['form-group', taskDateError ? 'input-error' : '']">
                    <label class="text" for="edit-task-date">Data de entrega (opcional)</label>
                    <input type="date" id="edit-task-date" v-model="taskDate" />
                    <p class="text text--error" v-if="taskDateError">{{ taskDateError }}</p>
                </div>

                <MarkdownEditor
                    label="Comentários (opcional)"
                    v-model:modelValue="taskComment"
                    @update="updateTaskComment"
                    aria-label="Comentários sobre a tarefa"
                />

                <div class="form-group">
                    <label class="text" for="edit-task-priority">Prioridade</label>
                    <div class="select">
                        <select
                            id="edit-task-priority"
                            v-model="taskPriority"
                            aria-label="Selecionar prioridade da tarefa"
                        >
                            <option value="1">Baixa</option>
                            <option value="2">Média</option>
                            <option value="3">Alta</option>
                        </select>
                    </div>
                </div>

                <UIButton type="submit" variant="primary" title="Concluir edição da tarefa">
                    <fa icon="check" />
                    Concluir edição
                </UIButton>
            </form>
        </template>
    </UIModal>
</template>

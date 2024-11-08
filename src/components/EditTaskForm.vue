<script setup>
import { DOC_NAME, TASK_PRIORITIES } from '../utils/variables';
import { filterField } from '../utils/stringUtils';
import { db } from '../libs/firebase';

import { ref, watch } from 'vue';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

import { useToast } from '../composables/useToast';
import { useAuthStore } from '../stores/authStore';

import RecognitionInput from './RecognitionInput.vue';
import MdEditor from './MdEditor.vue';

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

const editTask = async () => {
    if (!taskName.value) {
        taskNameError.value = "Preencha o campo";
        return;
    }

    const taskDateValue = new Date(taskDate.value);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    taskDateValue.setHours(0, 0, 0, 0);

    if (taskDateValue < today) {
        taskDateError.value = "Insira uma data futura ou atual.";
        return;
    }

    const docRef = doc(db, DOC_NAME, user.uid);

    if (!props?.topic) {
        showToast("danger", "Tópico da tarefa não encontrado.");
        return;
    }

    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        showToast("danger", "Dados do usuário não encontrados.");
        return;
    }

    const userData = docSnap.data();
    const selectedTopicData = userData.topics[props.topic];

    if (selectedTopicData && selectedTopicData.tasks) {
        const updatedTasks = selectedTopicData.tasks.map((t) =>
            t.id === props.task.id
                ? {
                    ...t,
                    name: filterField(taskName.value),
                    priority: taskPriority.value,
                    delivery_date: taskDate.value,
                    comment: taskComment.value,
                }
                : t
        );

        await updateDoc(docRef, {
            [`topics.${props.topic}.tasks`]: updatedTasks,
        });

        showToast("success", "Tarefa alterada com sucesso");
        closeEditTaskModal();
    } else {
        showToast("danger", "Tarefa não encontrada.");
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

            <form @submit.prevent="editTask">
                <RecognitionInput label="Nome da tarefa" placeholder="Editar tarefa..." v-model:modelValue="taskName"
                    :errorMessage="taskNameError" enableVoiceRecognition inputId="edit-task-name"
                    @update="updateTaskName" />

                <div :class="['form-group', taskDateError ? 'input-error' : '']">
                    <label class="text" for="edit-task-date">Data de entrega (opcional)</label>
                    <input type="date" id="edit-task-date" v-model="taskDate" />
                    <p class="text text--error" v-if="taskDateError">{{ taskDateError }}</p>
                </div>

                <MdEditor label="Comentários (opcional)" v-model:modelValue="taskComment" @update="updateTaskComment"
                    aria-label="Comentários sobre a tarefa" />

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

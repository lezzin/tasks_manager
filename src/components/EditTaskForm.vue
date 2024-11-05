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

    const docRef = doc(db, DOC_NAME, user.uid);

    if (!props?.topic) {
        showToast("error", "Tópico da tarefa não encontrado.");
        return;
    }

    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        showToast("error", "Dados do usuário não encontrados.");
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
        showToast("error", "Tarefa não encontrada.");
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
</script>

<template>
    <aside class="modal">
        <div class="modal__dialog">
            <div class="modal__header">
                <h2 class="modal__title">Editar tarefa</h2>
                <button class="btn" @click="closeEditTaskModal" title="Fechar modal">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>

            <form @submit.prevent="editTask">
                <RecognitionInput label="Nome da tarefa" placeholder="Editar tarefa..." v-model:modelValue="taskName"
                    :errorMessage="taskNameError" enableVoiceRecognition inputId="edit-task-name"
                    @update="updateTaskName" />

                <div class="form-group">
                    <label class="text" for="edit-task-date">Data de entrega (opcional)</label>
                    <input type="date" id="edit-task-date" v-model="taskDate" />
                </div>

                <MdEditor label="Comentários (opcional)" v-model:modelValue="taskComment" @update="updateTaskComment" />

                <div class="form-group">
                    <label class="text" for="edit-task-priority">Prioridade</label>
                    <div class="select">
                        <select id="edit-task-priority" v-model="taskPriority">
                            <option value="1">Baixa</option>
                            <option value="2">Média</option>
                            <option value="3">Alta</option>
                        </select>
                    </div>
                </div>

                <button type="submit" class="btn btn--primary btn--block" title="Concluir edição da tarefa">
                    <i class="fa-solid fa-check"></i> Concluir edição
                </button>
            </form>
        </div>
    </aside>
</template>

<script setup>
import { ref } from 'vue';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

import RecognitionInput from './RecognitionInput.vue';
import MdEditor from './MdEditor.vue';

import { useAuthStore } from '../stores/authStore';
import { db } from '../libs/firebase';
import { DOC_NAME, TASK_KANBAN_STATUSES, TASK_PRIORITIES } from '../utils/variables';
import { currentTime, filterField } from '../utils/functions';
import { useToast } from '../composables/useToast';

const props = defineProps({
    topic: {
        type: Object,
        required: false,
    },
    isActive: {
        type: Boolean,
        required: true,
    },
});

const emit = defineEmits(["close"]);

const { user } = useAuthStore();
const { showToast } = useToast();

const taskName = ref("");
const taskNameError = ref("");
const taskPriority = ref(TASK_PRIORITIES.low);
const taskDate = ref("");
const taskComment = ref("");

const closeAddingTask = () => {
    taskName.value = "";
    taskDate.value = "";
    taskComment.value = "";
    taskPriority.value = TASK_PRIORITIES.low;
    emit("close");
};

const updateTaskName = (value) => {
    taskName.value = value;
    taskNameError.value = "";
};

const updateTaskComment = (value) => {
    taskComment.value = value;
};

const addTask = async () => {
    if (!taskName.value) {
        taskNameError.value = "Preencha o campo";
        return;
    }

    const { name, id } = props.topic;
    const docRef = doc(db, DOC_NAME, user.uid);

    const taskData = {
        id: Date.now().toString(36),
        name: filterField(taskName.value),
        status: false,
        created_at: currentTime(),
        priority: taskPriority.value,
        comment: taskComment.value ?? "",
        delivery_date: taskDate.value,
        kanbanStatus: TASK_KANBAN_STATUSES.todo,
        topic_id: id,
    };

    const updatedTasks = [...props.topic.tasks, taskData];

    await updateDoc(docRef, {
        [`topics.${name}.${DOC_NAME}`]: updatedTasks,
    });

    showToast("success", "Tarefa adicionada com sucesso");
    closeAddingTask();
};
</script>

<template>
    <aside class="modal" v-if="props.isActive">
        <div class="modal__dialog">
            <div class="modal__header">
                <h2 class="modal__title">Adicionar tarefa</h2>
                <button class="btn" @click="closeAddingTask" title="Fechar modal">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>

            <form @submit.prevent="addTask">
                <RecognitionInput
                    label="Nome da tarefa"
                    placeholder="Adicionar tarefa..."
                    v-model:modelValue="taskName"
                    :errorMessage="taskNameError"
                    enableVoiceRecognition
                    inputId="add-task-name"
                    @update="updateTaskName"
                />

                <div class="form-group">
                    <label class="text" for="add-task-date">Data de entrega (opcional)</label>
                    <input type="date" v-model="taskDate" id="add-task-date" />
                </div>

                <MdEditor
                    label="Comentários (opcional)"
                    v-model:modelValue="taskComment"
                    @update="updateTaskComment"
                />

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

                <button
                    type="submit"
                    class="btn btn--primary btn--block"
                    title="Concluir adição da tarefa"
                >
                    Adicionar tarefa
                </button>
            </form>
        </div>
    </aside>
</template>

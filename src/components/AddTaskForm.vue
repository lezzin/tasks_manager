<script setup>
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthUser } from '../composables/useAuthUser';
import { db } from '../libs/firebase';
import { DOC_NAME, TASK_KANBAN_STATUSES, TASK_PRIORITIES } from '../utils/variables';
import { ref } from 'vue';
import { currentTime, filterField } from '../utils/functions';
import { useToast } from '../composables/useToast';
import RecognitionInput from './RecognitionInput.vue';
import MdEditor from './MdEditor.vue';

const { user } = useAuthUser();
const { showToast } = useToast();

const emit = defineEmits(["close"]);

const props = defineProps({
    topic: {
        type: Object,
        required: false
    },
    isActive: {
        type: Boolean,
        required: true
    }
});

const closeAddingTask = () => {
    emit("close");
}

const taskName = ref("");
const taskNameError = ref("");
const taskPriority = ref(TASK_PRIORITIES.small);
const taskDate = ref("");
const taskComment = ref("");

const getUserData = async (docRef) => {
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
};

const updateTaskName = (value) => {
    taskName.value = value;
    taskNameError.value = ''
}

const addTask = async () => {
    if (!taskName.value) {
        taskNameError.value = "Preencha o campo";
        return;
    }

    const { name, id } = props.topic;
    const docRef = doc(db, DOC_NAME, user.value.uid);
    const userData = await getUserData(docRef);

    if (userData && userData.topics) {
        const topic = userData.topics[name];

        if (topic) {
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
            const updatedTasks = [...topic.tasks, taskData];

            await updateDoc(docRef, {
                [`topics.${name}.${DOC_NAME}`]: updatedTasks,
            });
            showToast("success", "Tarefa adicionada com sucesso");
            closeAddingTask();
        }
    }
}

</script>

<template>
    <aside :class="['modal', isActive && 'active']">
        <div class="modal__dialog">
            <div class="modal__header">
                <h2 class="modal__title">Adicionar tarefa</h2>
                <button class="btn" @click="closeAddingTask" title="Fechar modal">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>

            <form @submit.prevent="addTask">
                <RecognitionInput label="Nome da tarefa" placeholder="Adicionar tarefa..." v-model:modelValue="taskName"
                    :errorMessage="taskNameError" enableVoiceRecognition inputId="add-task-name"
                    @update="updateTaskName" />

                <div class="form-group">
                    <label class="text" for="add-task-date">Data de entrega (opcional)</label>
                    <input type="date" v-model="taskDate" id="add-task-date" />
                </div>

                <MdEditor label="Comentários (opcional)" v-model:modelValue="taskComment" />

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

                <button type="submit" class="btn btn--primary btn--block" title="Concluir adição da tarefa">
                    Adicionar tarefa
                </button>
            </form>
        </div>
    </aside>
</template>
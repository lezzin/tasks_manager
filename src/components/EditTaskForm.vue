<script setup>
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthUser } from '../composables/useAuthUser';
import { db } from '../libs/firebase';
import { DOC_NAME } from '../utils/variables';
import { ref, watch } from 'vue';
import { filterField } from '../utils/functions';
import { useToast } from '../composables/useToast';
import RecognitionInput from './RecognitionInput.vue';
import MdEditor from './MdEditor.vue';

const emit = defineEmits(["close"]);

const props = defineProps({
    topic: {
        type: Object,
        required: false
    },
    task: {
        type: Object,
        required: false
    },
    isActive: {
        type: Boolean,
        required: true
    }
})

const { user } = useAuthUser();
const { showToast } = useToast();

const taskName = ref("");
const taskNameError = ref("");
const taskPriority = ref(1);
const taskDate = ref(null);
const taskComment = ref("");

const setTaskData = () => {
    taskName.value = props.task?.name || "";
    taskPriority.value = props.task?.priority || 1;
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

    const docRef = doc(db, DOC_NAME, user.value.uid);

    if (!props.topic.name) {
        showToast("error", "Tópico da tarefa não encontrado.");
        return;
    }

    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        showToast("error", "Dados do usuário não encontrados.");
        return;
    }

    const userData = docSnap.data();
    const selectedTopicData = userData.topics[props.topic.name];

    if (selectedTopicData && selectedTopicData.tasks) {
        const updatedTasks = selectedTopicData.tasks.map((t) => {
            if (t.id === props.task.id) {
                return {
                    ...t,
                    name: filterField(taskName.value),
                    priority: taskPriority.value,
                    delivery_date: taskDate.value,
                    comment: taskComment.value,
                };
            }
            return t;
        });

        await updateDoc(docRef, {
            [`topics.${props.topic.name}.tasks`]: updatedTasks,
        });

        showToast("success", "Tarefa alterada com sucesso");
        closeEditTaskModal();
    } else {
        showToast("error", "Tarefa não encontrada.");
    }
};

const closeEditTaskModal = () => {
    emit("close");
}
</script>

<template>
    <aside :class="['modal', isActive && 'active']">
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

<script setup>
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthUser } from '../composables/useAuthUser';
import { db } from '../libs/firebase';
import { DOC_NAME, TASK_PRIORITIES } from '../utils/variables';
import { ref, watch } from 'vue';
import { filterField } from '../utils/functions';
import { useToast } from '../composables/useToast';
import RecognitionInput from './RecognitionInput.vue';
import MdEditor from './MdEditor.vue';
import { useTaskStore } from '../stores/taskStore';

const taskStore = useTaskStore();

const { user } = useAuthUser();
const { showToast } = useToast();

const taskName = ref("");
const taskNameError = ref("");
const taskPriority = ref("");
const taskDate = ref("");
const taskComment = ref("");

const updateTaskName = (value) => {
    taskName.value = value;
    taskNameError.value = '';
};

const editTask = async () => {
    if (!taskName.value) {
        taskNameError.value = "Preencha o campo";
        return;
    }

    const docRef = doc(db, DOC_NAME, user.value.uid);
    const selectedTopicName = task.topicName;

    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        showToast("error", "Dados do usuário não encontrados.");
        return;
    }

    const userData = docSnap.data();
    const selectedTopicData = userData.topics[selectedTopicName];

    if (selectedTopicData && selectedTopicData.tasks) {
        const updatedTasks = selectedTopicData.tasks.map((t) => {
            if (t.id === taskStore.task.id) {
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
            [`topics.${selectedTopicName}.${DOC_NAME}`]: updatedTasks,
        });

        showToast("success", "Tarefa alterada com sucesso");
        taskStore.closeEditTaskModal();
    } else {
        showToast("error", "Tarefa não encontrada.");
    }
};

watch(() => taskStore.isEditFormVisible, isActive => {
    if (isActive) {
        taskName.value = taskStore.task.name || "";
        taskPriority.value = taskStore.task.priority || "";
        taskDate.value = taskStore.task?.delivery_date || "";
        taskComment.value = taskStore.task?.comment || "";
    }
});
</script>

<template>
    <aside :class="['modal', taskStore.isEditFormVisible ? 'active' : '']">
        <div class="modal__dialog">
            <div class="modal__header">
                <h2 class="modal__title">Editar tarefa</h2>
                <button class="btn" @click="taskStore.closeEditTaskModal" title="Fechar modal">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>

            <form @submit.prevent="editTask">
                <RecognitionInput label="Nome da tarefa" placeholder="Adicionar tarefa..." v-model:modelValue="taskName"
                    :errorMessage="taskNameError" enableVoiceRecognition inputId="edit-task-name"
                    @update:modelValue="updateTaskName" />

                <div class="form-group">
                    <label class="text" for="edit-task-date">Data de entrega (opcional)</label>
                    <input type="date" id="edit-task-date" v-model="taskDate" />
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

                <button type="submit" class="btn btn--primary btn--block" title="Concluir edição da tarefa">
                    <i class="fa-solid fa-check"></i> Concluir edição
                </button>
            </form>
        </div>
    </aside>
</template>
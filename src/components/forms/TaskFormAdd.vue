<script setup>
import { TASK_PRIORITIES } from '../../utils/variables';

import { computed, inject, onMounted, reactive, ref, watch } from 'vue';

import { useGemini } from '../../composables/useGemini';
import { useToast } from '../../composables/useToast';
import { useTask } from '../../composables/useTask';
import { useAuthStore } from '../../stores/authStore';

import UIButton from '../ui/UIButton.vue';
import InputRecognition from '../utilities/InputRecognition.vue';
import MarkdownEditor from '../utilities/MarkdownEditor.vue';
import UIDropdown from '../ui/UIDropdown.vue';
import UIModal from '../ui/UIModal.vue';

const props = defineProps({
    topicId: {
        type: String,
        default: "",
    },
});

const emit = defineEmits(["close"]);

const { user } = useAuthStore();
const { suggestTask, getUsageCount } = useGemini();
const { showToast } = useToast();
const { addTask, getUserTasksByTopic } = useTask();

const filterTask = inject("filterTask");
const searchTask = inject("searchTask");

const geminiSuggestedTask = reactive({
    data: null,
    usageRemaining: null
});
const isGeminiDropdownActive = ref(false);
const isRequestingGemini = ref(false);

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
        showToast("success", "Tarefa adicionada com sucesso.");
    } catch (error) {
        const errors = {
            "empty-name": () => (taskNameError.value = error.message),
            "invalid-date": () => (taskDateError.value = error.message),
        };
        errors[error.code] ? errors[error.code]() : showToast("danger", "Erro desconhecido. Tente novamente mais tarde.");
    }
};

const toggleGeminiDropdown = () => {
    isGeminiDropdownActive.value = !isGeminiDropdownActive.value;
};

const requestSuggestion = async () => {
    isRequestingGemini.value = true;
    taskNameError.value = "";

    try {
        const selectedTopicTasks = await getUserTasksByTopic(props.topicId, user.uid);
        const suggestionResponse = await suggestTask(selectedTopicTasks, user.uid);

        if (suggestionResponse.error) {
            showToast("danger", suggestionResponse.error);
            return;
        }

        geminiSuggestedTask.usageRemaining = await getUsageCount(user.uid);
        geminiSuggestedTask.data = suggestionResponse;
        taskName.value = geminiSuggestedTask.data.task;
        taskComment.value = geminiSuggestedTask.data.details;
    } catch (error) {
        console.error(error);
        showToast("danger", `Erro ao obter sugestão de tarefa.`);
    } finally {
        isRequestingGemini.value = false;
    }
};

const addSubtaskToTaskName = (subtask) => {
    taskName.value = subtask;
};

const buttonHtml = computed(() => {
    const usageCount = (geminiSuggestedTask.usageRemaining > 0) ? `${geminiSuggestedTask.usageRemaining} restantes` : 'limite atingido';

    return isRequestingGemini.value ?
        "Criando sugestão..." :
        `Pedir sugestão à IA (${usageCount})`
});

onMounted(async () => {
    geminiSuggestedTask.usageRemaining = await getUsageCount(user.uid);
});


watch(taskDate, () => (taskDateError.value = ""));
</script>

<template>
    <UIModal @close="closeAddingTask" titleId="add-task-modal-title">
        <template #title>Adicionar tarefa</template>
        <template #body>
            <form @submit.prevent="handleAddTask" aria-describedby="modal-add-task-title">
                <div class="add-input">
                    <InputRecognition label="Nome da tarefa" placeholder="Adicionar tarefa..."
                        v-model:modelValue="taskName" :errorMessage="taskNameError" enableVoiceRecognition
                        inputId="add-task-name" @update="updateTaskName" />

                    <UIButton v-if="!geminiSuggestedTask.data" variant="outline-primary-smallest"
                        @click="requestSuggestion"
                        :disabled="geminiSuggestedTask.usageRemaining === 0 || isRequestingGemini"
                        title="Pedir uma sugestão">
                        <img src="/src/assets/img/gemini-logo.png" width="18" height="18" alt="Logo do Gemini" />
                        <span> {{ buttonHtml }} </span>
                    </UIButton>

                    <UIDropdown v-else :isActive="isGeminiDropdownActive" @trigger="toggleGeminiDropdown">
                        <template #trigger="{ trigger }">
                            <UIButton variant="outline-primary-smallest" @click="trigger"
                                :title="isGeminiDropdownActive ? 'Esconder' : 'Visualizar'">
                                <img src="/src/assets/img/gemini-logo.png" width="18" height="18"
                                    alt="Logo do Gemini" />
                                <span>
                                    {{ isGeminiDropdownActive ? 'Esconder' : 'Visualizar' }} detalhes da sugestão
                                </span>
                            </UIButton>
                        </template>

                        <template #menu>
                            <div class="gemini__feedback text text--small">
                                <div class="feedback">
                                    <p class="text text--small" v-if="geminiSuggestedTask.usageRemaining">
                                        Você tem <span class="text--bold">{{ geminiSuggestedTask.usageRemaining
                                            }}</span> usos restantes.
                                    </p>
                                </div>

                                <div class="feedback">
                                    <h4>Justificativa: </h4>
                                    <p class="text text--small">{{ geminiSuggestedTask.data.justification }}</p>
                                </div>

                                <div v-if="geminiSuggestedTask.data?.subtasks?.length > 0" class="feedback">
                                    <h4>Subtarefas sugeridas: </h4>
                                    <div class="gemini__suggestions">
                                        <button type="button"
                                            v-for="(subtask, index) in geminiSuggestedTask.data.subtasks" :key="index"
                                            @click="addSubtaskToTaskName(subtask)">
                                            {{ subtask }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </UIDropdown>
                </div>

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

                <UIButton type="submit" variant="primary" title="Concluir adição da tarefa"
                    :disabled="isRequestingGemini">
                    <fa icon="check" /> Adicionar tarefa
                </UIButton>
            </form>
        </template>
    </UIModal>
</template>


<style scoped>
.add-input {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
}

.add-input .dropdown {
    width: 100%;
}

.gemini__toggler {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.gemini__feedback {
    display: grid;
    gap: 1.5rem;
    padding: 1rem;

    .dropdown__menu {
        width: 100%;
    }
}

.feedback {
    display: grid;
    gap: 0.5rem;

    h4 {
        font-weight: 600;
    }
}

.gemini__suggestions {
    display: grid;

    button {
        text-align: left;
        padding: 0.4rem .8rem;
        padding: 0.5rem;
        border: none;
        cursor: pointer;
        background: transparent;
        color: var(--details-color);
        transition: color var(--screen-transition) ease;

        &:hover {
            color: var(--details-color-dark);
        }
    }
}
</style>

<script setup>

const emit = defineEmits(["close"]);

const props = defineProps({
    isActive: {
        type: Boolean,
        required: true
    }
})

const closeAddingTask = () => {
    emit("close");
}

const addNewTaskName = ref("");
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
                <div class="form-group">
                    <label class="text" for="add-task-name">Nome da tarefa</label>
                    <div :class="['input-group', 'input-group-btn', formTaskError ? 'input-error' : '']">
                        <input type="text" id="add-task-name" placeholder="Adicionar tarefa..." v-model="addNewTaskName"
                            autocomplete="off" />
                        <button type="button" class="btn" title="Adicionar tarefa através de áudio"
                            @click="toggleSpeechRecognition('addTask')">
                            <i :class="['fa-solid', isListening ? 'fa-stop' : 'fa-microphone']"></i>
                        </button>
                    </div>
                    <p class="text text--error" v-if="formTaskError">
                        {{ formTaskError }}
                    </p>
                </div>

                <div class="form-group">
                    <label class="text" for="add-task-date">Data de entrega (opcional)</label>
                    <input type="date" v-model="addNewTaskDate" id="add-task-date" />
                </div>

                <div class="form-group">
                    <label class="text" for="add-task-comment">Comentários (opcional)</label>
                    <input type="text" id="add-task-comment" />
                </div>

                <div class="form-group">
                    <label class="text" for="edit-task-priority">Prioridade</label>
                    <div class="select">
                        <select id="edit-task-priority" v-model="addNewTaskPriority">
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
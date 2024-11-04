<template>
    <aside :class="['modal', editingTask && 'active']">
        <div class="modal__dialog">
            <div class="modal__header">
                <h2 class="modal__title">Editar tarefa</h2>
                <button class="btn" @click="closeEditingTask" title="Fechar modal">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>

            <form @submit.prevent="editTask">
                <div class="form-group">
                    <label class="text" for="edit-task-name">Nome</label>
                    <div :class="['input-group', 'input-group-btn', formTaskError ? 'input-error' : '']">
                        <input type="text" id="edit-task-name" v-model="editNewTaskName" />
                        <button type="button" class="btn" title="Editar tarefa através de áudio"
                            @click="toggleSpeechRecognition('editTask')">
                            <i :class="['fa-solid', isListening ? 'fa-stop' : 'fa-microphone']"></i>
                        </button>
                    </div>
                    <p class="text text--error" v-if="editNewTaskNameError">
                        {{ editNewTaskNameError }}
                    </p>
                </div>

                <div class="form-group">
                    <label class="text" for="edit-task-date">Data de entrega (opcional)</label>
                    <input type="date" id="edit-task-date" v-model="editNewTaskDate" />
                </div>

                <div class="form-group">
                    <label class="text" for="edit-task-comment">Comentários (opcional)</label>
                    <input type="text" id="edit-task-comment" />
                </div>

                <div class="form-group">
                    <label class="text" for="edit-task-priority">Prioridade</label>
                    <div class="select">
                        <select id="edit-task-priority" v-model="editNewTaskPriority"
                            :class="{ 'input-error': editNewTaskPriorityError }">
                            <option value="1">Baixa</option>
                            <option value="2">Média</option>
                            <option value="3">Alta</option>
                        </select>
                    </div>
                    <p class="text text--error" v-if="editNewTaskPriorityError">
                        {{ editNewTaskPriorityError }}
                    </p>
                </div>

                <button type="submit" class="btn btn--primary btn--block" title="Concluir edição da tarefa">
                    <i class="fa-solid fa-check"></i> Concluir edição
                </button>
            </form>
        </div>
    </aside>
</template>
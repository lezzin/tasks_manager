<template>
    <aside :class="['modal', editingTopic && 'active']">
            <div class="modal__dialog">
                <div class="modal__header">
                    <h2 class="modal__title">Editar tópico</h2>
                    <button class="btn" @click="closeEditingTopic" title="Fechar modal">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>

                <form @submit.prevent="editTopic">
                    <div :class="['form-group', topicEditingError ? 'input-error' : '']">
                        <label class="text" for="edit-topic-name">Nome</label>
                        <input
                            type="text"
                            id="edit-topic-name"
                            v-model="topicNewName"
                            :class="{ 'input-error' : topicEditingError }"
                        />
                        <p class="text text--error" v-if="topicEditingError">
                            {{ topicEditingError }}
                        </p>
                    </div>

                    <button
                        type="submit"
                        class="btn btn--primary btn--block"
                        title="Concluir edição do tópico"
                    >
                        <i class="fa-solid fa-check"></i> Concluir edição
                    </button>
                </form>
            </div>
        </aside>
</template>
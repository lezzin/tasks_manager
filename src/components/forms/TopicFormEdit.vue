<script setup>
import { ref, watch } from 'vue';

import { useToast } from '../../composables/useToast';
import { useAuthStore } from '../../stores/authStore';
import { useTopic } from '../../composables/useTopic';

const { showToast } = useToast();
const { editTopic } = useTopic();
const { user } = useAuthStore();
const emit = defineEmits(["close"]);

const props = defineProps({
    topic: {
        type: String,
        required: false
    }
});

const oldName = ref(null);
const name = ref("");
const nameError = ref("");

const setTopicData = () => {
    oldName.value = props.topic;
    name.value = props.topic;
};

const handleEditTopic = async () => {
    try {
        await editTopic(name.value, oldName.value, user.uid);
        showToast("success", "Tópico atualizado com sucesso.");
        closeEditTopicModal();
    } catch (error) {
        if (error.code == "name") {
            nameError.value = error.message;
            return;
        }

        if (error.code == "same-name") {
            closeEditTopicModal();
            return;
        }

        showToast("danger", "Erro desconhecido. Tente novamente mais tarde.");
        console.error(error);
    }
};

const closeEditTopicModal = () => {
    name.value = "";
    nameError.value = "";
    emit("close");
};

watch(() => props.topic, setTopicData, { immediate: true });
</script>

<template>
    <aside class="modal" role="dialog" aria-modal="true" aria-labelledby="edit-topic-modal-title">
        <div class="modal__dialog">
            <div class="modal__header">
                <h2 id="edit-topic-modal-title" class="modal__title">Editar tópico</h2>
                <button class="btn" @click="closeEditTopicModal" title="Fechar modal"
                    aria-label="Fechar edição de tópico">
                    <fa icon="times" />
                </button>
            </div>

            <form @submit.prevent="handleEditTopic" aria-describedby="edit-topic-instructions">
                <p id="edit-topic-instructions" class="sr-only">Modifique o nome do tópico e confirme a edição.</p>

                <div :class="['form-group', nameError ? 'input-error' : '']">
                    <label class="text" for="edit-topic-name">Nome</label>
                    <input type="text" id="edit-topic-name" v-model="name" :class="{ 'input-error': nameError }"
                        aria-describedby="edit-topic-error" />
                    <p id="edit-topic-error" class="text text--error" v-if="nameError">
                        {{ nameError }}
                    </p>
                </div>

                <button type="submit" class="btn btn--primary btn--block" title="Concluir edição do tópico"
                    aria-label="Confirmar edição do tópico">
                    <fa icon="check" /> Concluir edição
                </button>
            </form>
        </div>
    </aside>
</template>

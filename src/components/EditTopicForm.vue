<script setup>
import { filterField } from '../utils/stringUtils';
import { DOC_NAME, TOPIC_MAX_LENGTH, TOPIC_MIN_LENGTH } from '../utils/variables';
import { db } from '../libs/firebase';

import { ref, watch } from 'vue';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

import { useToast } from '../composables/useToast';
import { useAuthStore } from '../stores/authStore';

const { showToast } = useToast();
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

watch(() => props.topic, setTopicData, { immediate: true });

const fetchUserData = async (docRef) => {
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
};

const editTopic = async () => {
    nameError.value = "";

    if (!name.value) {
        nameError.value = "Preencha o campo de edição";
        return;
    }

    const formattedTopicName = filterField(name.value);

    if (formattedTopicName.length < TOPIC_MIN_LENGTH) {
        formTopicError.value = `Insira pelo menos ${TOPIC_MIN_LENGTH} letras!`;
        return;
    }

    if (formattedTopicName.length > TOPIC_MAX_LENGTH) {
        nameError.value = `Você atingiu o limite de caracteres! (${formattedTopicName.length} de ${TOPIC_MAX_LENGTH})`;
        return;
    }

    if (formattedTopicName === oldName.value) {
        closeEditTopicModal();
        return;
    }

    const docRef = doc(db, DOC_NAME, user.uid);
    const userData = await fetchUserData(docRef);

    if (userData.topics[formattedTopicName]) {
        nameError.value = "Esse tópico já existe";
        return;
    }

    const updatedTopics = {
        ...userData.topics,
        [formattedTopicName]: {
            ...userData.topics[oldName.value],
            name: formattedTopicName,
        },
    };
    delete updatedTopics[oldName.value];

    await updateDoc(docRef, { topics: updatedTopics });
    showToast("success", "Tópico atualizado com sucesso");
    closeEditTopicModal();
};

const closeEditTopicModal = () => {
    name.value = "";
    nameError.value = "";
    emit("close");
};
</script>

<template>
    <aside class="modal" role="dialog" aria-modal="true" aria-labelledby="edit-topic-modal-title">
        <div class="modal__dialog">
            <div class="modal__header">
                <h2 id="edit-topic-modal-title" class="modal__title">Editar tópico</h2>
                <button class="btn" @click="closeEditTopicModal" title="Fechar modal"
                    aria-label="Fechar edição de tópico">
                    <i class="fa-solid fa-times" aria-hidden="true"></i>
                </button>
            </div>

            <form @submit.prevent="editTopic" aria-describedby="edit-topic-instructions">
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
                    <i class="fa-solid fa-check" aria-hidden="true"></i> Concluir edição
                </button>
            </form>
        </div>
    </aside>
</template>

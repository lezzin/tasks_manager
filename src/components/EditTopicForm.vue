<script setup>
import { filterField } from '../utils/stringUtils';
import { DOC_NAME } from '../utils/variables';
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

    if (formattedTopicName.length <= 3) {
        nameError.value = "Insira pelo menos 4 letras!";
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
    <aside class="modal">
        <div class="modal__dialog">
            <div class="modal__header">
                <h2 class="modal__title">Editar tópico</h2>
                <button class="btn" @click="closeEditTopicModal" title="Fechar modal">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>

            <form @submit.prevent="editTopic">
                <div :class="['form-group', nameError ? 'input-error' : '']">
                    <label class="text" for="edit-topic-name">Nome</label>
                    <input type="text" id="edit-topic-name" v-model="name" :class="{ 'input-error': nameError }" />
                    <p class="text text--error" v-if="nameError">
                        {{ nameError }}
                    </p>
                </div>

                <button type="submit" class="btn btn--primary btn--block" title="Concluir edição do tópico">
                    <i class="fa-solid fa-check"></i> Concluir edição
                </button>
            </form>
        </div>
    </aside>
</template>
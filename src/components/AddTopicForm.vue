<script setup>
import { currentTime } from '../utils/dateUtils';
import { filterField } from '../utils/stringUtils';
import { DOC_NAME, TOPIC_MAX_LENGTH, TOPIC_MIN_LENGTH } from '../utils/variables';
import { db } from '../libs/firebase';

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { onMounted, ref, watch } from 'vue';

import { useToast } from '../composables/useToast';
import { useAuthStore } from '../stores/authStore';

const nameError = ref("");
const name = ref("");

const { user } = useAuthStore();
const { showToast } = useToast();

const getUserData = async (docRef) => {
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
};

const addTopic = async () => {
    nameError.value = "";

    if (!name.value) {
        nameError.value = "Preencha o campo";
        return;
    }

    const formattedTopicName = filterField(name.value);

    if (formattedTopicName.length < TOPIC_MIN_LENGTH) {
        nameError.value = `Insira pelo menos ${TOPIC_MIN_LENGTH} letras!`;
        return;
    }

    if (formattedTopicName.length > TOPIC_MAX_LENGTH) {
        nameError.value = `Você atingiu o limite de caracteres! (${formattedTopicName.length} de ${TOPIC_MAX_LENGTH})`;
        return;
    }

    const docRef = doc(db, DOC_NAME, user.uid);
    const userData = await getUserData(docRef);

    if (userData && userData.topics && userData.topics[formattedTopicName]) {
        nameError.value = "Esse tópico já existe";
        return;
    }

    await setDoc(docRef, {}, { merge: true });
    await updateDoc(docRef, {
        [`topics.${formattedTopicName}`]: {
            id: Date.now().toString(26),
            name: formattedTopicName,
            tasks: [],
            created_at: currentTime(),
        },
    });

    showToast("success", "Tópico criado com sucesso");
    name.value = "";
};

watch(name, () => (nameError.value = ""));
</script>

<template>
    <form @submit.prevent="addTopic" class="add-topic-form" aria-labelledby="add-topic-title">
        <h2 id="add-topic-title" class="sr-only">Adicionar Novo Tópico</h2>

        <div class="form-group">
            <div :class="['input-group', nameError ? 'input-error' : '']">
                <label for="new-topic" class="sr-only">Nome do novo tópico</label>
                <input type="text" id="new-topic" placeholder="Adicionar novo tópico" v-model="name"
                    :aria-invalid="!!nameError" aria-describedby="topic-error" />
                <button class="btn" title="Adicionar novo tópico" aria-label="Adicionar novo tópico">
                    <i class="fa-solid fa-plus" aria-hidden="true"></i>
                </button>
            </div>

            <p v-if="nameError" id="topic-error" class="text text--error" role="alert">
                {{ nameError }}
            </p>
        </div>
    </form>
</template>

<style scoped>
.add-topic-form {
    width: 100%;
}

.input-group input {
    box-shadow: 0 0.25rem 1rem var(--details-color-light);
}
</style>

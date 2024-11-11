<script setup>
import { ref, watch, watchEffect } from 'vue';

import { useToast } from '../../composables/useToast';
import { useTopic } from '../../composables/useTopic';
import { useAuthStore } from '../../stores/authStore';
import UIButton from '../ui/UIButton.vue';
import { useSidebarStore } from '../../stores/sidebarStore';

const nameError = ref("");
const name = ref("");

const sidebarStore = useSidebarStore();
const { user } = useAuthStore();
const { addTopic } = useTopic();
const { showToast } = useToast();

const handleAddTopic = async () => {
    try {
        await addTopic(name.value, user.uid);
        showToast("success", "Tópico criado com sucesso.");
        name.value = "";
    } catch (error) {
        if (error.code == "name") {
            nameError.value = error.message;
            return;
        }

        showToast("danger", "Erro desconhecido. Tente novamente mais tarde.");
    }
};

watch(name, () => (nameError.value = ""));

watchEffect(() => {
    if (!sidebarStore.isTopicSidebarActive) {
        nameError.value = "";
        name.value = "";
    }
});
</script>

<template>
    <form @submit.prevent="handleAddTopic" class="add-topic-form" aria-labelledby="add-topic-title">
        <h2 id="add-topic-title" class="sr-only">Adicionar Novo Tópico</h2>

        <div class="form-group">
            <div :class="['input-group', nameError ? 'input-error' : '']">
                <label for="new-topic" class="sr-only">Nome do novo tópico</label>
                <input type="text" id="new-topic" placeholder="Adicionar novo tópico" v-model="name"
                    :aria-invalid="!!nameError" aria-describedby="topic-error" />

                <UIButton type="submit" title="Adicionar novo tópico">
                    <fa icon="plus" />
                </UIButton>
            </div>

            <p id="topic-error" class="text text--error" role="alert" v-if="nameError">
                {{ nameError }}
            </p>
        </div>
    </form>
</template>

<style scoped>
.add-topic-form {
    width: 100%;
}

input {
    box-shadow: 0 .5rem 1rem var(--details-color-light);
}
</style>

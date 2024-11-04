<script setup>
import { DOC_NAME } from '../utils/variables';
import { db } from '../libs/firebase';

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { RouterLink, useRouter } from 'vue-router';
import { inject, ref } from 'vue';

import { useAuthStore } from '../stores/authStore';
import { useToast } from '../composables/useToast';

import EditTopicForm from './EditTopicForm.vue';

const emit = defineEmits(['close']);

const { user } = useAuthStore();
const { showToast } = useToast();
const router = useRouter();

const props = defineProps({
    data: {
        type: Array,
        default: []
    }
});

const selectedTopic = inject("selectedTopic");

const getUserData = async (docRef) => {
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
};

const closeTopicsMenu = () => {
    emit("close");
};

const deleteTopic = async (topicName) => {
    if (!confirm("Tem certeza que deseja excluir esse tópico? Essa ação não poderá ser desfeita!"))
        return;

    const docRef = doc(db, DOC_NAME, user.uid);
    const userData = await getUserData(docRef);

    if (!userData || !userData.topics || !userData.topics[topicName]) {
        showToast("error", "Tópico não encontrado");
        return;
    }

    delete userData.topics[topicName];
    await updateDoc(docRef, { topics: userData.topics });
    showToast("success", "Tópico excluído com sucesso");
    selectedTopic.value = null;
    if (router.currentRoute.value.fullPath !== '/') router.push("/");
};

const deleteAllTopics = async () => {
    if (!confirm("Tem certeza que deseja excluir TODOS os seus tópicos? Essa ação não poderá ser desfeita!"))
        return;

    const docRef = doc(db, DOC_NAME, user.uid);
    const userData = await getUserData(docRef);

    if (!userData || !userData.topics || Object.keys(userData.topics).length === 0) {
        showToast("error", "Nenhum tópico encontrado para excluir.");
        return;
    }

    await updateDoc(docRef, { topics: {} });
    showToast("success", "Todos os tópicos foram excluídos com sucesso.");
    selectedTopic.value = null;
}

const isEditTopicModalActive = ref(false);
const editingTopic = ref(null);

const openEditTopicModal = (topicName) => {
    isEditTopicModalActive.value = true;
    editingTopic.value = topicName;
}

const closeEditTopicModal = () => {
    isEditTopicModalActive.value = false;
}
</script>

<template>
    <div v-if="props.data?.length">
        <h2 class="title">Seus tópicos</h2>
        <div class="topics-nav">
            <div class="topic" v-for="topic in props.data" :key="topic.id"
                :class="{ active: selectedTopic && topic.name === selectedTopic.name }">
                <RouterLink @click.native="closeTopicsMenu" :to="'/topic/' + topic.id" class="topic__link btn"
                    role="button" :title="'Acessar tópico ' + topic.name" aria-label="Acessar tópico">
                    <div>
                        <p class="text">{{ topic.name }}</p>
                        <p class="text text--small text--muted">
                            {{ `${topic.tasks_length} ${topic.tasks_length === 1 ? 'tarefa' : 'tarefas'}` }}
                        </p>
                    </div>
                </RouterLink>

                <div class="topic__actions">
                    <button class="btn btn--rounded" title="Editar tópico" @click="openEditTopicModal(topic.name)"
                        aria-label="Editar tópico">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn btn--rounded" title="Excluir tópico" @click="deleteTopic(topic.name)"
                        aria-label="Excluir tópico">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="home-aside__footer" v-if="props.data?.length">
        <span class="divider"></span>

        <RouterLink to="/kanban" class="btn btn--outline-primary btn--icon btn--block-small" title="Acessar Kanban">
            <i class="fa-solid fa-chart-simple"></i>
            Acessar Kanban
        </RouterLink>

        <RouterLink to="/general" class="btn btn--outline-primary btn--icon btn--block-small"
            title="Visualização geral">
            <i class="fa-solid fa-eye"></i>
            Visão geral das tarefas
        </RouterLink>

        <button class="btn btn--icon btn--block-small btn--outline-danger" title="Excluir todos os tópicos"
            @click="deleteAllTopics" aria-label="Excluir todos os tópicos">
            <i class="fa-solid fa-trash"></i> Excluir todos os tópicos
        </button>

        <a title="Acessar GitHub" href="https://lezzin.github.io" target="_blank" aria-label="Acessar GitHub">
            <i class="fab fa-github"></i> Criado por Leandro Adrian da Silva
        </a>
    </div>
    <p class="text text--center" v-else>Nenhum tópico cadastrado</p>

    <EditTopicForm :isActive="isEditTopicModalActive" :topic="editingTopic" @close="closeEditTopicModal" />
</template>

<style scoped>
.topics-nav {
    display: flex;
    flex-direction: column;
    margin: 0.5rem 0 1rem;
    gap: 0.6rem;

    .topic {
        display: flex;
        justify-content: space-between;
        align-items: center;
        text-decoration: none;
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        transition: all var(--screen-transition);
        padding: 0 1.5rem;

        &.active {
            background-color: var(--details-color);

            .topic__link,
            .topic__actions {
                color: var(--font-secondary);
            }
        }

        &:hover:not(.active) {
            background-color: var(--bg-secondary);
        }

        .topic__link {
            flex: 1;
            padding: 1rem;

            &.router-link-exact-active .text--muted {
                opacity: 1;
            }

            &:hover {
                filter: none;
            }

            .text:not(.text--muted) {
                font-weight: 500;
            }
        }

        .topic__actions {
            display: flex;
            align-items: center;
            gap: 0.5rem;

            .btn {
                border: 1px solid transparent;

                &:hover {
                    filter: unset;
                    border-color: var(--border-color);
                }
            }
        }
    }
}

.home-aside__footer {
    margin-top: auto;
    display: grid;
    gap: 0.6rem;

    a:last-of-type {
        margin-top: 0.5rem;
        text-align: center;
        font-size: 1.2rem;
    }
}
</style>

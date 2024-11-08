<script setup>
import { DOC_NAME } from '../../utils/variables';
import { db } from '../../libs/firebase';

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { RouterLink, useRouter } from 'vue-router';
import { inject, markRaw, onMounted, ref } from 'vue';

import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../../composables/useToast';
import { useModal } from '../../composables/useModal';

import TopicFormEdit from '../forms/TopicFormEdit.vue';

const emit = defineEmits(['close']);

const { user } = useAuthStore();
const { showToast } = useToast();
const router = useRouter();
const modal = useModal();

const props = defineProps({
    data: {
        type: Array,
        default() {
            return []
        }
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
        showToast("danger", "Tópico não encontrado.");
        return;
    }

    delete userData.topics[topicName];
    await updateDoc(docRef, { topics: userData.topics });
    showToast("success", "Tópico excluído com sucesso.");
    selectedTopic.value = null;
    if (router.currentRoute.value.fullPath !== '/') router.push("/");
};

const deleteAllTopics = async () => {
    if (!confirm("Tem certeza que deseja excluir TODOS os seus tópicos? Essa ação não poderá ser desfeita!"))
        return;

    const docRef = doc(db, DOC_NAME, user.uid);
    const userData = await getUserData(docRef);

    if (!userData || !userData.topics || Object.keys(userData.topics).length === 0) {
        showToast("danger", "Nenhum tópico encontrado para excluir.");
        return;
    }

    await updateDoc(docRef, { topics: {} });
    showToast("success", "Todos os tópicos foram excluídos com sucesso.");
    selectedTopic.value = null;
}

const editingTopic = ref(null);

const openEditTopicModal = (topicName) => {
    editingTopic.value = topicName;
    modal.component.value = markRaw(TopicFormEdit);
    modal.showModal();
}
</script>

<template>
    <div v-if="props.data?.length">
        <h2 class="subtitle">Seus tópicos</h2>
        <div class="topics-nav">
            <div class="topic" v-for="topic in props.data" :key="topic.id"
                :class="{ active: selectedTopic && topic.name === selectedTopic.name }">
                <RouterLink @click="closeTopicsMenu" :to="'/topic/' + topic.id" class="topic__link btn" role="button"
                    :title="'Acessar tópico ' + topic.name" aria-label="Acessar tópico">
                    <p class="text text--bold">{{ topic.name }}</p>
                    <p class="text text--small text--muted">
                        {{ `${topic.tasks_length} ${topic.tasks_length === 1 ? 'tarefa' : 'tarefas'}` }}
                    </p>
                </RouterLink>

                <div class="topic__actions">
                    <button class="btn btn--rounded" title="Editar tópico" @click="openEditTopicModal(topic.name)"
                        aria-label="Editar tópico">
                        <fa icon="pen" />
                    </button>
                    <button class="btn btn--rounded" title="Excluir tópico" @click="deleteTopic(topic.name)"
                        aria-label="Excluir tópico">
                        <fa icon="trash" />
                    </button>
                </div>
            </div>
        </div>
    </div>


    <div class="footer" v-if="props.data?.length">
        <span class="divider"></span>

        <div class="footer__buttons">
            <RouterLink to="/kanban" class="btn btn--outline-primary btn--icon btn--block-small" title="Acessar Kanban">
                <fa icon="chart-simple" />
                Acessar Kanban
            </RouterLink>

            <RouterLink to="/pomodoro" class="btn btn--outline-primary btn--icon btn--block-small"
                title="Acessar Pomodoro">
                <fa icon="clock" />
                Acessar Pomodoro
            </RouterLink>

            <RouterLink to="/general" class="btn btn--outline-primary btn--icon btn--block-small"
                title="Visualização geral">
                <fa icon="eye" />
                Visão geral das tarefas
            </RouterLink>

            <button class="btn btn--icon btn--block-small btn--outline-danger" title="Excluir todos os tópicos"
                @click="deleteAllTopics" aria-label="Excluir todos os tópicos">
                <fa icon="trash" />
                Excluir todos os tópicos
            </button>
        </div>
    </div>

    <p class="text text--center" v-else>Nenhum tópico cadastrado</p>

    <Teleport to="#modal">
        <Transition>
            <TopicFormEdit v-if="modal.show.value" @close="modal.hideModal" :topic="editingTopic" />
        </Transition>
    </Teleport>
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
        }

        .topic__actions {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            width: min-content;

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

.footer {
    margin-top: auto;
}

.footer__buttons {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.6rem;
}

.footer__buttons>* {
    flex: 1;
    width: fit-content;
}
</style>

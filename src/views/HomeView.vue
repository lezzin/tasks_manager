<script setup>
import { PRINCIPAL_DOC_NAME, PAGE_TITLES, TASK_PRIORITIES } from "../utils/variables";

import { onMounted, provide, reactive, ref, computed, watch, markRaw } from "vue";
import { doc, onSnapshot } from "firebase/firestore";
import { useRoute, useRouter } from "vue-router";

import { useAuthStore } from "../stores/authStore";
import { useLoadingStore } from "../stores/loadingStore";
import { useSidebarStore } from "../stores/sidebarStore";
import { useModal } from "../composables/useModal";
import { useToast } from "../composables/useToast";
import { useTopic } from "../composables/useTopic";

import TaskNavigation from "../components/task/TaskNavigation.vue";
import TaskFormAdd from "../components/forms/TaskFormAdd.vue";
import TopicFormAdd from "../components/forms/TopicFormAdd.vue";
import TopicNavigation from "../components/topic/TopicNavigation.vue";
import ImageResponsive from "../components/shared/ImageResponsive.vue";
import UIButton from "../components/ui/UIButton.vue";

const props = defineProps({
    db: {
        type: Object,
        required: false,
    },
});

const selectedTopic = ref(null);
const aside = ref(null);
const defaultTasks = ref([]);

const modal = useModal();
const { showToast } = useToast();
const { getTopicInfo } = useTopic();
const { user } = useAuthStore();
const loadingStore = useLoadingStore();
const sidebarStore = useSidebarStore();

const topics = reactive({ data: [] });
const route = useRoute();
const router = useRouter();

const filterTask = ref("all");
const searchTask = ref("");

const filteredTasks = computed(() => {
    let tasks = defaultTasks.value;

    if (searchTask.value.trim()) {
        const searchTerm = searchTask.value.trim().toLowerCase();
        tasks = tasks.filter((task) => task.name.toLowerCase().includes(searchTerm));
    }

    if (filterTask.value !== "all") {
        const taskIsCompleted = filterTask.value === TASK_PRIORITIES.completed;
        tasks = tasks.filter((task) => task.status === taskIsCompleted);
    }

    return tasks.sort((taskA, taskB) => {
        if (taskA.status !== taskB.status) return taskA.status ? -1 : 1;
        if (taskA.priority !== taskB.priority) return taskB.priority - taskA.priority;
        return taskA.name.localeCompare(taskB.name);
    });
});

watch(searchTask, (newValue) => {
    if (newValue.trim()) {
        filterTask.value = "all";
    }
});

watch(filterTask, (newValue) => {
    if (newValue !== "all") {
        searchTask.value = "";
    }
});

const loadTopicTasks = (topicId) => {
    const docRef = doc(props.db, PRINCIPAL_DOC_NAME, user.uid);

    onSnapshot(docRef, (doc) => {
        const userData = doc.data();
        if (!userData || !userData.topics || !userData.tasks) {
            defaultTasks.value = [];
            return;
        }

        defaultTasks.value = Object.values(userData.tasks).filter(
            (task) => task.topicId === topicId
        );
    });
};

const loadTopic = async (id) => {
    if (!id) {
        document.title = PAGE_TITLES.home.default;
        return;
    }

    const topic = await getTopicInfo(id, user.uid);

    if (!topic) {
        if (router.currentRoute !== "/") router.push("/");
        return;
    }

    selectedTopic.value = topic;
    loadTopicTasks(topic.id);
    document.title = PAGE_TITLES.home.topic(topic.name);
};

const loadTopics = () => {
    const docRef = doc(props.db, PRINCIPAL_DOC_NAME, user.uid);
    loadingStore.showLoader();

    onSnapshot(
        docRef,
        (doc) => {
            const userData = doc.data();
            const topicsExists =
                userData && userData.topics && Object.keys(userData.topics).length > 0;

            if (!topicsExists) {
                sidebarStore.setSidebarActive(true);
                topics.data = null;
                return;
            }

            topics.data = Object.values(userData.topics)
                .map((topic) => {
                    const tasksLength = userData.tasks
                        ? Object.values(userData.tasks).filter((task) => task.topicId === topic.id)
                              .length
                        : 0;

                    return {
                        id: topic.id,
                        name: topic.name,
                        created_at: topic.created_at,
                        tasks_length: tasksLength,
                    };
                })
                .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

            if (!route.params.id) {
                document.title = PAGE_TITLES.home.default;
                return;
            }

            loadTopic(route.params.id);
        },
        (error) => {
            if (!user.value) return;
            showToast("danger", "Erro ao obter tópicos. Tente novamente mais tarde.");
        }
    );

    loadingStore.hideLoader();
};

const openAddTaskModal = () => {
    modal.component.value = markRaw(TaskFormAdd);
    modal.showModal();
};

onMounted(() => {
    sidebarStore.setShowSidebarToggler(true);
    loadTopics();
});

watch(
    () => route.params.id,
    (newId) => {
        loadTopic(newId);
    }
);

provide("filterTask", filterTask);
provide("searchTask", searchTask);
provide("selectedTopic", selectedTopic);
</script>

<template>
    <div class="home-wrapper">
        <section
            :class="['container', defaultTasks.length > 0 && 'task-container']"
            v-if="selectedTopic"
        >
            <div id="add-task-container">
                <UIButton
                    @click="openAddTaskModal"
                    title="Abrir modal de nova tarefa"
                    aria-haspopup="dialog"
                    aria-controls="add-task-modal"
                    variant="outline-primary"
                    isRounded
                >
                    <span class="sr-only">Adicionar nova tarefa</span>
                    <fa icon="plus" />
                </UIButton>
            </div>

            <div v-if="defaultTasks.length > 0">
                <header class="task-container__header" role="banner">
                    <form @submit.prevent aria-labelledby="search-task-label">
                        <div class="form-group">
                            <label for="search-task" id="search-task-label" class="text"
                                >Pesquisar</label
                            >
                            <div class="input-group">
                                <input
                                    type="text"
                                    @input="searchTaskByName"
                                    id="search-task"
                                    placeholder="Descrição da tarefa"
                                    v-model="searchTask"
                                    autocomplete="off"
                                    aria-describedby="search-task-help"
                                />

                                <span id="search-task-help" class="sr-only">
                                    Digite a descrição da tarefa para buscar
                                </span>

                                <UIButton type="submit" title="Pesquisar tarefa">
                                    <fa icon="search" />
                                    <span class="sr-only">Pesquisar</span>
                                </UIButton>
                            </div>
                        </div>
                    </form>

                    <form @submit.prevent aria-labelledby="filter-task-label">
                        <div class="form-group">
                            <label for="filter-task" id="filter-task-label" class="text"
                                >Filtrar</label
                            >
                            <div class="select">
                                <select
                                    id="filter-task"
                                    @change="searchTaskByStatus"
                                    v-model="filterTask"
                                    aria-describedby="filter-task-help"
                                >
                                    <option value="all">Todas</option>
                                    <option value="completed">Concluídas</option>
                                    <option value="not-completed">Não concluídas</option>
                                </select>
                                <span id="filter-task-help" class="sr-only"
                                    >Escolha um filtro para as tarefas</span
                                >
                            </div>
                        </div>
                    </form>
                </header>

                <span class="divider" role="separator" aria-hidden="true"></span>

                <section aria-label="Lista de tarefas filtradas">
                    <TaskNavigation :topic="selectedTopic.name" :tasks="filteredTasks" />
                </section>
            </div>
            <div v-else class="image-centered" aria-live="polite" aria-atomic="true">
                <ImageResponsive
                    small="task_empty_sm.png"
                    lg="task_empty_lg.png"
                    alt="Frase tarefas vazias e uma imagem de uma caixa vazia"
                />
            </div>
        </section>
        <div v-else class="container image-centered" aria-live="polite" aria-atomic="true">
            <ImageResponsive
                small="topic_unselected_sm.png"
                lg="topic_unselected_lg.png"
                alt="Uma pessoa escrevendo em um diário suas tarefas pessoais"
            />
        </div>
    </div>

    <Teleport to="#modal">
        <Transition>
            <TaskFormAdd
                v-if="modal.show.value"
                @close="modal.hideModal"
                :topicId="selectedTopic.id"
                id="add-task-modal"
            />
        </Transition>
    </Teleport>

    <Transition name="slide">
        <nav
            class="home-aside"
            aria-label="Navegação de tópicos"
            v-if="sidebarStore.isTopicSidebarActive"
            ref="aside"
        >
            <TopicFormAdd />
            <span class="divider" role="separator" aria-hidden="true"></span>
            <TopicNavigation :data="topics.data" @close="sidebarStore.closeSidebar" />
        </nav>
    </Transition>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
    transition: all var(--screen-transition) ease;
}

.slide-enter-from,
.slide-leave-to {
    transform: translateX(-100%);
    opacity: 0;
}

.container {
    position: relative;
}

#add-task-container {
    position: fixed;
    max-width: calc(1080px - var(--padding));
    width: calc(100% - var(--padding));
    bottom: calc(var(--padding) * 2);
    z-index: 980;
    display: flex;
    justify-content: flex-end;

    @media (max-width: 768px) {
        right: calc(var(--padding) * 2);
    }

    button {
        height: 5rem;
        aspect-ratio: 1;
        box-shadow: var(--shadow-md);

        i {
            font-size: 2rem;
        }
    }
}

.home-aside {
    border-right: 1px solid var(--border-color);
    box-shadow: var(--shadow-md);
    background-color: var(--bg-primary);
    padding: var(--padding);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: fixed;
    width: 30vw;
    inset: 10vh 0 0;
    z-index: 980;

    @media (width <=768px) {
        width: 100vw;
    }

    .divider {
        margin: 0.5rem 0 1rem;
    }
}

.task-container {
    padding: var(--padding) 0;

    .task-container__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 1rem;

        @media (width <=768px) {
            flex-wrap: wrap;

            form {
                width: 100%;
            }
        }
    }
}
</style>

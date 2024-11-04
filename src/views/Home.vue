<script setup>
import { inject, onMounted, provide, reactive, ref, watch } from 'vue';
import AddTopicForm from '../components/AddTopicForm.vue';
import TopicNav from '../components/TopicNav.vue';
import { DOC_NAME, PAGE_TITLES, TASK_PRIORITIES } from '../utils/variables';
import { doc, onSnapshot } from 'firebase/firestore';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import TaskNav from '../components/TaskNav.vue';
import AddTaskForm from '../components/AddTaskForm.vue';

const props = defineProps({
    db: {
        type: Object,
        required: false
    }
});

const loadedTopics = ref(false);
const isMenuTopicsActive = inject('isMenuTopicsActive');
const isAddTaskModalActive = ref(false);

const selectedTopic = ref(null);
const defaultTasks = ref(null);

const { user } = useAuthStore();
const topics = reactive({ data: [] });
const route = useRoute();
const router = useRouter();

const filterTask = ref("all");
const searchTask = ref("");

const searchTaskByName = () => {
    filterTask.value = "all";
    const searchTerm = searchTask.value.trim().toLowerCase();
    selectedTopic.value.tasks = defaultTasks.value.filter((task) =>
        task.name.toLowerCase().includes(searchTerm)
    );
    sortTasksByPriority();
};

const searchTaskByStatus = () => {
    searchTask.value = "";
    const selectedFilter = filterTask.value;

    if (selectedFilter == "all") {
        selectedTopic.value.tasks = defaultTasks.value;
    } else {
        const taskIsCompleted = selectedFilter == TASK_PRIORITIES.completed;
        selectedTopic.value.tasks = defaultTasks.value.filter((task) => task.status == taskIsCompleted);
    }

    sortTasksByPriority();
}

const sortTasksByPriority = () => {
    selectedTopic.value.tasks = selectedTopic.value.tasks.sort((taskA, taskB) => {
        const priorityA = taskA.priority;
        const priorityB = taskB.priority;
        const statusA = taskA.status;
        const statusB = taskB.status;

        if (statusA !== statusB) {
            return statusA ? -1 : 1;
        }

        if (priorityA !== priorityB) {
            return priorityB - priorityA;
        }

        return 0;
    });
}

const loadTopic = (id) => {
    selectedTopic.value = null;

    if (!id) {
        document.title = PAGE_TITLES.home.default;
        return;
    }

    if (!topics.data) {
        if (router.currentRoute != "/") router.push("/");
        return;
    }

    const topic = topics.data.find((topic) => topic.id == id);

    if (!topic) {
        if (router.currentRoute != "/") router.push("/");
        return;
    }

    selectedTopic.value = topic;
    defaultTasks.value = topic.tasks;
    document.title = PAGE_TITLES.home.topic(topic.name);

    sortTasksByPriority();
}

const loadTopics = () => {
    const docRef = doc(props.db, DOC_NAME, user.uid);

    onSnapshot(
        docRef,
        (doc) => {
            const userData = doc.data();
            const topicsExists = userData && userData.topics && Object.keys(userData.topics).length > 0;

            if (!topicsExists) {
                topics.data = null;
                return;
            }

            topics.data = Object.keys(userData.topics)
                .map((topicName) => {
                    const topic = userData.topics[topicName];
                    return {
                        id: topic.id,
                        name: topic.name,
                        tasks: topic.tasks,
                        tasks_length: topic.tasks?.length ?? 0,
                        created_at: topic.created_at,
                    };
                })
                .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

            if (route.params.id) {
                loadTopic(route.params.id);
            } else {
                document.title = PAGE_TITLES.home.default;
            }
        },
        (error) => {
            if (!user.value) return;
            showToast("error", "Erro ao obter documento: " + error.message);
        }
    );

    loadedTopics.value = true;
}

const closeTopicsMenu = () => {
    isMenuTopicsActive.value = false;
}

const openAddTaskModal = () => {
    isAddTaskModalActive.value = true;
}

const closeAddTaskModal = () => {
    isAddTaskModalActive.value = false;
}

onMounted(() => {
    inject('showTopicNavBtn').value = true;
    loadTopics();
})

watch(() => route.params.id, (newId) => {
    loadTopic(newId);
});

provide("selectedTopic", selectedTopic);
</script>

<template id="home-page">
    <div class="home-wrapper" v-if="loadedTopics">
        <aside :class="['home-aside', isMenuTopicsActive && 'home-aside--active']">
            <AddTopicForm />

            <span class="divider"></span>

            <TopicNav :data="topics.data" @close="closeTopicsMenu" />
        </aside>

        <div :class="['container', defaultTasks ? 'task-container' : '']" v-if="selectedTopic">
            <div id="add-task-container">
                <button @click="openAddTaskModal" title="Abrir modal de nova tarefa"
                    class="btn btn--rounded btn--outline-primary">
                    <i class="fa-solid fa-plus"></i>
                </button>
            </div>

            <div v-if="defaultTasks">
                <div class="task-container__header">
                    <form onsubmit="return false">
                        <div class="form-group">
                            <label for="search-task" class="text">Pesquisar</label>
                            <div class="input-group">
                                <input type="text" @input="searchTaskByName" id="search-task"
                                    placeholder="Descrição da tarefa" v-model="searchTask" autocomplete="off" />
                                <button type="submit" class="btn" title="Pesquisar tarefa">
                                    <i class="fa-solid fa-search"></i>
                                </button>
                            </div>
                        </div>
                    </form>
                    <form onsubmit="return false">
                        <div class="form-group">
                            <label for="filter-task" class="text">Filtrar</label>
                            <div class="select">
                                <select id="filter-task" @change="searchTaskByStatus" v-model="filterTask">
                                    <option value="all">Todas</option>
                                    <option value="completed">Concluídas</option>
                                    <option value="not-completed">
                                        Não concluídas
                                    </option>
                                </select>
                            </div>
                        </div>
                    </form>
                </div>

                <span class="divider"></span>

                <TaskNav :topic="selectedTopic" />
            </div>
            <div v-else class="image-centered">
                <img src="/src/assets/img/task_empty_lg.png" alt="Frase tarefas vazias e uma imagem de uma caixa vazia"
                    class="large-screen" loading="lazy" />
                <img src="/src/assets/img/task_empty_sm.png" alt="Frase tarefas vazias e uma imagem de uma caixa vazia"
                    class="small-screen" loading="lazy" />
            </div>
        </div>
        <div class="container image-centered" v-else>
            <img src="/src/assets/img/topic_unselected_lg.png"
                alt="Uma pessoa escrevendo em um diário suas tarefas pessoais" class="large-screen" loading="lazy" />
            <img src="/src/assets/img/topic_unselected_sm.png"
                alt="Uma pessoa escrevendo em um diário suas tarefas pessoais" class="small-screen" loading="lazy" />
        </div>
    </div>

    <AddTaskForm :isActive="isAddTaskModalActive" @close="closeAddTaskModal" :topic="selectedTopic" />
</template>

<style scoped>
.home-wrapper {
    .container {
        position: relative;
    }

    #add-task-container {
        position: fixed;
        max-width: calc(1080px - (var(--padding) * 2));
        width: 100%;
        bottom: calc(var(--padding) * 2);
        z-index: 99;

        display: flex;
        justify-content: flex-end;

        @media (width<=768px) {
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
        z-index: 999;
        transform: translateX(-100%);
        transition: transform var(--screen-transition) ease-in-out;

        @media (width <=768px) {
            width: 100vw;
        }

        &.home-aside--active {
            transform: translateX(0);
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
}
</style>
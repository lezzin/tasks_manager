<script setup>
import { ref, reactive, onMounted, inject } from 'vue';
import { marked } from 'marked';
import { doc, getDoc } from 'firebase/firestore';
import { saveAs } from 'file-saver';
import { DOC_NAME, PAGE_TITLES, TASK_PRIORITIES } from '../utils/variables.js';
import { formatDate, getPriorityClass, getPriorityText, getPriorityIcon } from '../utils/functions.js';
import { useToast } from '../composables/useToast.js';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const { showToast } = useToast();
const { user } = useAuthStore();
const router = useRouter();

const props = defineProps(['db']);
const allUserTasks = ref([]);
const loadedTasks = ref(false);
const priorityCount = reactive({
    completed: 0,
    high: 0,
    medium: 0,
    small: 0,
});

const sendBack = () => {
    router.back();
};

const downloadAsPDF = () => {
    const container = document.getElementById("pdf-container");

    domtoimage.toBlob(container)
        .then(function (blob) {
            saveAs(blob, `${Date.now()}.png`);
        })
        .catch((error) => {
            showToast("error", "Error capturing the container: " + error);
        });
};

const focusTasksByPriority = (priority) => {
    allUserTasks.value.forEach((task) => {
        task.isHovering = true;
        task.isFocused =
            task.priority === priority ||
            (priority === TASK_PRIORITIES.completed && task.status);
    });
};

const removeFocusFromTasks = () => {
    allUserTasks.value.forEach((task) => {
        task.isHovering = false;
        task.isFocused = false;
    });
};

const formatComment = (comment) => {
    return marked.parse(comment, {
        gfm: true,
        breaks: true,
    });
};

const createTaskObject = ({ name, id }, task) => {
    return {
        topic_name: name,
        topic_id: id,
        ...task,
        isHovering: false,
        isFocused: false,
    };
};

const updatePriorityCounter = () => {
    priorityCount.completed = allUserTasks.value.filter((task) => task.status).length;
    priorityCount.high = allUserTasks.value.filter((task) => task.priority === TASK_PRIORITIES.high).length;
    priorityCount.medium = allUserTasks.value.filter((task) => task.priority === TASK_PRIORITIES.medium).length;
    priorityCount.small = allUserTasks.value.filter((task) => task.priority === TASK_PRIORITIES.low).length;
};

const fetchUserTasks = async () => {
    try {
        const docRef = doc(props.db, DOC_NAME, user.uid);
        const docSnap = await getDoc(docRef);
        const userData = docSnap.data();

        if (!userData?.topics || Object.keys(userData.topics).length === 0) {
            loadedTasks.value = true;
            return;
        }

        allUserTasks.value = getUserTasks(userData.topics);

        updatePriorityCounter();
    } catch (error) {
        showToast("error", `Erro ao obter tarefas: ${error}`);
    } finally {
        loadedTasks.value = true;
    }
};

const getUserTasks = (topics) => {
    return Object.values(topics)
        .filter((topic) => topic.tasks?.length > 0)
        .flatMap((topic) => topic.tasks.map((task) => createTaskObject(topic, task)))
        .sort((taskA, taskB) => {
            if (taskA.status !== taskB.status) return taskA.status ? -1 : 1;
            return taskB.priority - taskA.priority;
        });
};

onMounted(() => {
    document.title = PAGE_TITLES.general;
    inject('showTopicNavBtn').value = false;

    fetchUserTasks();
});
</script>

<template>
    <div v-if="loadedTasks" id="general-page-container">
        <div class="task-view container" v-if="allUserTasks.length > 0" id="pdf-container">
            <div class="task-view__header">
                <h2 class="title">Visualize as suas tarefas de uma maneira geral</h2>
                <div class="task-view__header-buttons">
                    <button type="button" @click="downloadAsPDF" class="btn btn--block btn--primary btn--icon"
                        title="Baixar em PDF">
                        <i class="fa-solid fa-download"></i>
                        Baixar tarefas
                    </button>
                    <button @click="sendBack()" class="btn btn--outline-primary btn--only-icon"
                        title="Voltar para o início">
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                </div>
            </div>

            <div class="legend">
                <div class="legend__item completed" @mouseover="focusTasksByPriority('completed')"
                    @mouseleave="removeFocusFromTasks">
                    <p class="text text--small">
                        <i :class="getPriorityIcon('completed')"></i>
                        Concluídas ({{ priorityCount.completed }})
                    </p>
                </div>

                <div class="legend__item priority-high" @mouseover="focusTasksByPriority('3')"
                    @mouseleave="removeFocusFromTasks">
                    <p class="text text--small">
                        <i :class="getPriorityIcon('3')"></i>
                        Alta prioridade ({{ priorityCount.high }})
                    </p>
                </div>

                <div class="legend__item priority-medium" @mouseover="focusTasksByPriority('2')"
                    @mouseleave="removeFocusFromTasks">
                    <p class="text text--small">
                        <i :class="getPriorityIcon('2')"></i>
                        Média prioridade ({{ priorityCount.medium }})
                    </p>
                </div>

                <div class="legend__item priority-low" @mouseover="focusTasksByPriority('1')"
                    @mouseleave="removeFocusFromTasks">
                    <p class="text text--small">
                        <i :class="getPriorityIcon('1')"></i>
                        Baixa prioridade ({{ priorityCount.small }})
                    </p>
                </div>
            </div>

            <span class="divider"></span>

            <div class="grid">
                <router-link
                    :class="['grid__item', 'task', task.status && 'completed', { 'task--hovering': task.isHovering, 'task--focused': task.isFocused }]"
                    v-for="task in allUserTasks" :key="task.id" role="button" :to="'/topic/' + task.topic_id"
                    title="Acessar tópico">
                    <div class="grid__item-header">
                        <p class="grid__item-title text text--small text--muted">
                            {{ task.topic_name }}
                        </p>
                        <div class="grid__item-info">
                            <p class="grid__item-name text">{{ task.name }}</p>

                            <div class="grid__item-info--small">
                                <span :class="['tag', getPriorityClass(task.priority)]">
                                    <i :class="getPriorityIcon(task.priority)"></i>
                                    {{ getPriorityText(task.priority) }}
                                </span>
                                <p class="text text--icon text--small">
                                    <i class="fa-regular fa-clock"></i> Criado em: {{ task.created_at }}
                                </p>
                                <p class="text text--icon text--small" v-if="task.delivery_date">
                                    <i class="fa-regular fa-bell"></i> Entrega para: {{ formatDate(task.delivery_date)
                                    }}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="grid__item-footer" v-if="task.comment">
                        <div class="grid__item-comment">
                            <p class="text text--small text--muted">
                                Comentário da tarefa:
                            </p>

                            <div class="markdown-content markdown-content--small truncate"
                                v-html="formatComment(task.comment)"></div>
                        </div>
                    </div>
                </router-link>
            </div>
        </div>
        <div class="container" v-else>
            <router-link to="/" title="Voltar para o início">
                <img src="/src/assets/img/task_empty_lg.png" alt="Frase tarefas vazias e uma imagem de uma caixa vazia"
                    class="large-screen" width="1200" height="640" loading="lazy" />
                <img src="/src/assets/img/task_empty_sm.png" alt="Frase tarefas vazias e uma imagem de uma caixa vazia"
                    class="small-screen" width="640" height="640" loading="lazy" />
            </router-link>
        </div>
    </div>
</template>

<style scoped>
#general-page-container {
    .task-view {
        padding: var(--padding) var(--padding) calc(var(--padding) * 5);

        .task-view__header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            text-align: center;

            @media (width <=768px) {
                flex-direction: column;
                padding-top: var(--padding);
                gap: 1rem;
            }

            .task-view__header-buttons {
                display: flex;
                align-items: center;
                gap: 0.6rem;
            }
        }

        .legend {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            margin: 1rem 0 2rem;
            gap: 1rem;

            .legend__item {
                text-align: center;
                border: 1px solid var(--border-color);
                border-radius: var(--radius);
                padding: calc(var(--padding) / 2);
                cursor: default;
                font-weight: 500;
                box-shadow: var(--shadow-sm);
            }
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1rem;

            @media (width <=768px) {
                padding-bottom: calc(var(--padding) * 2);
            }

            .grid__item {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 1rem;
                background-color: var(--bg-primary);
                padding: var(--padding);
                border: 1px solid var(--border-color);
                border-radius: var(--radius);
                text-decoration: none;
                transition: all 0.3s ease;

                &.completed .grid__item-footer {
                    --border-color: hsl(158, 40%, 70%);
                }

                &.task--hovering:not(.task--focused) {
                    opacity: 0.4;
                }

                .grid__item-header {
                    display: grid;
                    gap: 1rem;

                    >.text {
                        font-weight: 500;
                    }

                    .grid__item-info {
                        display: grid;
                        gap: 1rem;

                        .grid__item-info--small {
                            display: flex;
                            align-items: flex-start;
                            flex-direction: column;
                            gap: 0.5rem;

                            .tag {
                                border-radius: calc(var(--radius) * 1.5);
                                margin-bottom: 0.25rem;
                            }
                        }
                    }
                }

                .grid__item-footer {
                    width: 100%;
                    margin-top: auto;

                    .grid__item-comment {
                        height: 100%;
                        padding: calc(var(--padding) / 2);
                        border: 1px solid var(--border-color);
                        border-radius: var(--radius);

                        div {
                            * {
                                margin: revert;
                                padding: revert;
                            }

                            a {
                                pointer-events: none;
                                text-decoration: none;
                            }
                        }
                    }
                }
            }
        }
    }
}
</style>
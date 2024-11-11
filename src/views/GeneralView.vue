<script setup>
import { PAGE_TITLES, TASK_PRIORITIES } from '../utils/variables.js';
import { getPriorityClass, getPriorityText, getPriorityIcon } from '../utils/priorityUtils.js';
import { formatDate } from '../utils/dateUtils.js';

import { ref, reactive, onMounted, inject } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

import domtoimage from "dom-to-image-more";
import { saveAs } from 'file-saver';
import { marked } from 'marked';

import { useToast } from '../composables/useToast.js';
import { useTask } from '../composables/useTask.js';
import { useAuthStore } from '../stores/authStore.js';
import { useLoadingStore } from '../stores/loadingStore.js';
import { useSidebarStore } from '../stores/sidebarStore.js';

import ImageResponsive from '../components/shared/ImageResponsive.vue';
import UIButton from '../components/ui/UIButton.vue';

const { showToast } = useToast();
const { getUserTasksWithTopic } = useTask();
const { user } = useAuthStore();
const sidebarStore = useSidebarStore();
const loadingStore = useLoadingStore();
const router = useRouter();

const props = defineProps(['db']);

const isDownloading = ref(false);
const allUserTasks = ref([]);
const container = ref(null);
const priorityCount = reactive({
    completed: 0,
    high: 0,
    medium: 0,
    small: 0,
});

const downloadAsPDF = () => {
    isDownloading.value = true;

    domtoimage.toBlob(container.value)
        .then(blob => saveAs(blob, `${Date.now()}.png`))
        .catch((error) => showToast("danger", "Erro ao baixar tarefas. Tente novamente mais tarde."))
        .finally(() => (isDownloading.value = false));
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

const updatePriorityCounter = () => {
    priorityCount.completed = allUserTasks.value.filter((task) => !!task.status).length;
    priorityCount.high = allUserTasks.value.filter((task) => task.priority === TASK_PRIORITIES.high).length;
    priorityCount.medium = allUserTasks.value.filter((task) => task.priority === TASK_PRIORITIES.medium).length;
    priorityCount.small = allUserTasks.value.filter((task) => task.priority === TASK_PRIORITIES.low).length;
};

const loadTasks = async () => {
    loadingStore.showLoader();

    try {
        allUserTasks.value = await getUserTasksWithTopic(user.uid)
        updatePriorityCounter();
    } catch (error) {
        showToast("danger", `Erro ao resgatar tarefas. Tente novamente mais tarde.`);
    } finally {
        loadingStore.hideLoader();
    }
};

onMounted(() => {
    document.title = PAGE_TITLES.general;
    sidebarStore.setShowSidebarToggler(false);
    loadTasks();
});
</script>

<template>
    <div class="task-view container" v-if="allUserTasks.length > 0" ref="container">
        <header class="task-view__header" role="banner">
            <h2 class="title" v-if="!isDownloading">Visualize as suas tarefas de uma maneira geral</h2>

            <div class="task-view__header-buttons" v-if="!isDownloading">
                <UIButton type="button" @click="downloadAsPDF" variant="primary" isIcon
                    title="Baixar todas as tarefas em PDF">
                    <fa icon="download" />
                    <span class="sr-only">Baixar tarefas</span>
                </UIButton>
                <UIButton @click="() => router.back()" variant="outline-primary" isIcon
                    title="Voltar para a página anterior">
                    <fa icon="arrow-left" />
                    <span class="sr-only">Voltar</span>
                </UIButton>
            </div>
        </header>

        <section class="legend" aria-labelledby="task-legend">
            <h3 id="task-legend" class="sr-only">Legenda de prioridade de tarefas</h3>
            <div class="legend__item completed" @mouseover="focusTasksByPriority(TASK_PRIORITIES.completed)"
                @mouseleave="removeFocusFromTasks" aria-label="Tarefas concluídas: {{ priorityCount.completed }}"
                tabindex="0">
                <p class="text text--small">
                    <fa :icon="getPriorityIcon(TASK_PRIORITIES.completed)" />
                    Concluídas ({{ priorityCount.completed }})
                </p>
            </div>
            <div class="legend__item priority-high" @mouseover="focusTasksByPriority(TASK_PRIORITIES.high)"
                @mouseleave="removeFocusFromTasks" :aria-label="`Tarefas de alta prioridade: ${priorityCount.high}`"
                tabindex="0">
                <p class="text text--small">
                    <fa :icon="getPriorityIcon(TASK_PRIORITIES.high)" />
                    Alta prioridade ({{ priorityCount.high }})
                </p>
            </div>
            <div class="legend__item priority-medium" @mouseover="focusTasksByPriority(TASK_PRIORITIES.medium)"
                @mouseleave="removeFocusFromTasks" :aria-label="`Tarefas de média prioridade: ${priorityCount.medium}`"
                tabindex="0">
                <p class="text text--small">
                    <fa :icon="getPriorityIcon(TASK_PRIORITIES.medium)" />
                    Média prioridade ({{ priorityCount.medium }})
                </p>
            </div>
            <div class="legend__item priority-low" @mouseover="focusTasksByPriority(TASK_PRIORITIES.low)"
                @mouseleave="removeFocusFromTasks" :aria-label="`Tarefas de baixa prioridade: ${priorityCount.small}`"
                tabindex="0">
                <p class="text text--small">
                    <fa :icon="getPriorityIcon(TASK_PRIORITIES.low)" />
                    Baixa prioridade ({{ priorityCount.small }})
                </p>
            </div>
        </section>

        <span class="divider" role="separator" aria-hidden="true"></span>

        <div class="grid" role="list" aria-label="Lista de tarefas">
            <RouterLink :class="[
                'grid__item',
                'task',
                task.status && TASK_PRIORITIES.completed,
                { 'task--hovering': task.isHovering, 'task--focused': task.isFocused }
            ]" v-for="task in allUserTasks" :key="task.id" role="listitem" :to="'/topic/' + task.topicId"
                title="Acessar tópico {{ task.topicName }}"
                aria-label="Tarefa: {{ task.name }}, status: {{ task.status ? 'Concluída' : 'Pendente' }}, prioridade: {{ getPriorityText(task.priority) }}">
                <div class="grid__item-header">
                    <p class="grid__item-title text text--small text--muted">
                        {{ task.topicName }}
                    </p>
                    <div class="grid__item-info">
                        <p class="grid__item-name text">{{ task.name }}</p>

                        <div class="grid__item-info--small">
                            <span :class="['tag', getPriorityClass(task.priority)]" aria-hidden="true">
                                <i :class="getPriorityIcon(task.priority)" aria-hidden="true"></i>
                                {{ getPriorityText(task.priority) }}
                            </span>
                            <p class="text text--icon text--small">
                                <fa icon="clock" />
                                Criado em: {{ task.created_at }}
                            </p>
                            <p class="text text--icon text--small" v-if="task.delivery_date">
                                <fa icon="bell" />
                                Entrega para: {{ formatDate(task.delivery_date) }}
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
                            v-html="formatComment(task.comment)" aria-label="Comentário sobre a tarefa"></div>
                    </div>
                </div>
            </RouterLink>
        </div>
    </div>

    <div class="container" v-else>
        <RouterLink to="/" title="Voltar para o início">
            <ImageResponsive small="task_empty_sm.png" lg="task_empty_lg.png"
                alt="Frase tarefas vazias e uma imagem de uma caixa vazia" />
        </RouterLink>
    </div>
</template>

<style scoped>
.task-view {
    padding: var(--padding) var(--padding) calc(var(--padding) * 5);
    background: var(--bg-secondary);

    .task-view__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        text-align: center;
        height: 4.876vh;

        @media (width <=768px) {
            flex-direction: column;
            padding-top: var(--padding);
            gap: 1rem;
            height: auto;
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

        ~* {
            margin-top: auto;
        }
    }
}
</style>
const DOC_NAME = "tasks";
const PROJECT_TITLE = "TaskFlow";

const PAGE_TITLES = {
    login: `${PROJECT_TITLE} | Acessar sua conta`,
    not_found: `${PROJECT_TITLE} | Página não encontrada`,
    home: {
        default: `${PROJECT_TITLE} | Suas tarefas`,
        topic: (topicName) => `${PROJECT_TITLE} | ${topicName}`,
    },
    general: `${PROJECT_TITLE} | Visão geral`,
    kanban: `${PROJECT_TITLE} | Kanban`,
};

const TASK_PRIORITIES = {
    high: 3,
    medium: 2,
    low: 1,
    completed: "completed",
};

const TASK_KANBAN_STATUSES = {
    todo: "todo",
    doing: "doing",
    completed: "completed",
};

const TOAST_TIMEOUT = 5000;

export { TASK_PRIORITIES, TASK_KANBAN_STATUSES, TOAST_TIMEOUT, PAGE_TITLES, DOC_NAME, };

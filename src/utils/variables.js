const PRINCIPAL_DOC_NAME = "users";
const AI_USAGE_DOC_NAME = "ai_usage";

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
    pomodoro: `${PROJECT_TITLE} | Pomodoro`,
};

const TASK_PRIORITIES = {
    high: "3",
    medium: "2",
    low: "1",
    completed: "completed",
};

const TASK_KANBAN_STATUSES = {
    todo: "todo",
    doing: "doing",
    completed: "completed",
};

const TOAST_TIMEOUT = 5000;

const TOPIC_MAX_LENGTH = 20;
const TOPIC_MIN_LENGTH = 4;

export {
    TASK_KANBAN_STATUSES,
    TASK_PRIORITIES,
    TOAST_TIMEOUT,
    PAGE_TITLES,
    PRINCIPAL_DOC_NAME,
    AI_USAGE_DOC_NAME,
    TOPIC_MAX_LENGTH,
    TOPIC_MIN_LENGTH
};

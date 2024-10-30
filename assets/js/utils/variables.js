const DOC_NAME = "tasks";
const PROJECT_TITLE = "TaskFlow";

const PAGE_TITLES = {
    "login": `${PROJECT_TITLE} | Acessar sua conta`,
    "not_found": `${PROJECT_TITLE} | Página não encontrada`,
    "home": `${PROJECT_TITLE} | Suas tarefas`,
    "general": `${PROJECT_TITLE} | Visão geral`,
    "kanban": `${PROJECT_TITLE} | Kanban`,
}

const TASK_PRIORITIES = {
    high: 3,
    medium: 2,
    small: 1,
    completed: "completed"
}

const TASK_KANBAN_STATUSES = {
    todo: "todo",
    doing: "doing",
    completed: "completed",
}

// Milisegundos
const TOAST_ANIMATION = 300;

export {
    TASK_PRIORITIES,
    TASK_KANBAN_STATUSES,
    TOAST_ANIMATION,
    PAGE_TITLES,
    DOC_NAME
};
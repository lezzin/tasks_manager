import { TASK_PRIORITIES } from "./variables.js";

export function getPriorityClass(priority) {
    return (
        {
            [TASK_PRIORITIES.high]: "priority-high",
            [TASK_PRIORITIES.medium]: "priority-medium",
            [TASK_PRIORITIES.low]: "priority-low",
        }[priority] ?? ""
    );
}

export function getPriorityText(priority) {
    return (
        {
            [TASK_PRIORITIES.high]: "Alta prioridade",
            [TASK_PRIORITIES.medium]: "Média prioridade",
            [TASK_PRIORITIES.low]: "Baixa prioridade",
        }[priority] || ""
    );
}

export function getPriorityIcon(priority) {
    const icon = (className) => `fa-solid fa-${className}`;

    return (
        {
            [TASK_PRIORITIES.high]: icon("arrow-up"),
            [TASK_PRIORITIES.medium]: icon("arrow-right"),
            [TASK_PRIORITIES.low]: icon("arrow-down"),
            [TASK_PRIORITIES.completed]: icon("check-circle"),
        }[priority] || ""
    );
}

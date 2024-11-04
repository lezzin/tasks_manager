import { TASK_PRIORITIES } from "./variables.js";

export function formatDate(date) {
    const utcDate = new Date(date + "T00:00:00Z");

    const day = utcDate.getUTCDate();
    const month = utcDate.getUTCMonth() + 1;
    const year = utcDate.getUTCFullYear();

    return `${day < 10 ? "0" : ""}${day}/${month < 10 ? "0" : ""}${month}/${year}`;
}

export function filterField(field) {
    return String(field)
        .trim()
        .replace(/[.\[\]*`]/g, "");
}

export function currentTime() {
    return new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

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

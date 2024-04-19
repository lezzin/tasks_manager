const PAGE_TITLES = {
    "login": "TaskFlow | Acessar sua conta",
    "not_found": "TaskFlow | Página não encontrada",
    "home": "TaskFlow | Suas tarefas",
    "general": "TaskFlow | Visão geral",
}

const TASK_PRIORITIES = {
    high: 3,
    medium: 2,
    small: 1
}

function formatDate(date) {
    const utcDate = new Date(date + "T00:00:00Z");

    const day = utcDate.getUTCDate();
    const month = utcDate.getUTCMonth() + 1;
    const year = utcDate.getUTCFullYear();

    return `${day < 10 ? '0' : ''}${day}/${month < 10 ? '0' : ''}${month}/${year}`;
}

function currentTime() {
    return new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

export {
    PAGE_TITLES,
    TASK_PRIORITIES,
    currentTime,
    formatDate
};
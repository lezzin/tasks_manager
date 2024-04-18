const PAGE_TITLES = {
    "login": "TaskFlow | Acessar sua conta",
    "not_found": "TaskFlow | Página não encontrada",
    "home": "TaskFlow | Suas tarefas",
}

const TASK_PRIORITIES = {
    high: 3,
    medium: 2,
    small: 1
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
    currentTime
};
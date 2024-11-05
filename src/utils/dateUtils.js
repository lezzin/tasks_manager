const options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
}

export function currentTime() {
    return new Date().toLocaleDateString("pt-BR", options);
}

export function createTime(date) {
    return new Date(date).toLocaleDateString("pt-BR", options);
}
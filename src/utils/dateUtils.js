const options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
}

export function currentTime() {
    return new Date().toLocaleString("pt-BR", options);
}

export function createTime(date) {
    if (!date) return null;
    const dateObject = new Date(date);
    return dateObject.toLocaleString("pt-BR", options);
}

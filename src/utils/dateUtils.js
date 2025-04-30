const options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
};

export function currentTime() {
    return new Date().toLocaleString("pt-BR", options);
}

export function formatDate(date) {
    if (!date) return "";

    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
}

export function addZeroToTime(time) {
    return time < 10 ? "0" + time : time;
}

export function filterField(field) {
    return String(field).trim().replace(/[.[\]*`]/g, "");
}
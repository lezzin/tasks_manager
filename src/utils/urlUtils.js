const baseUrl = (image) => new URL(`/src/assets/img/${image}`, import.meta.url).href;

export { baseUrl }
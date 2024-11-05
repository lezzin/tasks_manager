<script setup>
const props = defineProps({
    small: {
        type: String,
        required: true
    },
    lg: {
        type: String,
        required: true
    },
    alt: {
        type: String,
        default: ""
    },
});

const smallImage = new URL(`../assets/img/${props.small}`, import.meta.url).href;
const lgImage = new URL(`../assets/img/${props.lg}`, import.meta.url).href;
</script>

<template>
    <picture>
        <source :srcset="`${smallImage} 600w, ${lgImage} 1000w`" type="image/png" />
        <img :src="lgImage" sizes="(max-width: 768px) 100vw, (min-width: 769px) 50vw" :alt="props.alt" loading="lazy" />
    </picture>
</template>

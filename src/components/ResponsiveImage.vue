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

const IMAGES_PATH = '/src/assets/img';
</script>

<template>
    <picture>
        <source :srcset="`${IMAGES_PATH}/${props.small} 600w, ${IMAGES_PATH}/${props.lg} 1000w`" type="image/png" />
        <img :src="`${IMAGES_PATH}/${props.lg}`" sizes="(max-width: 768px) 100vw, (min-width: 769px) 50vw"
            :alt="props.alt" loading="lazy" />
    </picture>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

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

const isSmallScreen = ref(window.innerWidth < 768);

const updateScreenSize = () => {
    isSmallScreen.value = window.innerWidth < 768;
};

onMounted(() => {
    window.addEventListener('resize', updateScreenSize);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', updateScreenSize);
});
</script>

<template>
    <picture>
        <source v-if="isSmallScreen" :srcset="`${smallImage} 600w`" type="image/png" />
        <source v-else :srcset="`${lgImage} 1000w`" type="image/png" />
        <img v-if="isSmallScreen" :src="smallImage" :alt="props.alt" loading="lazy" />
        <img v-else :src="lgImage" :alt="props.alt" loading="lazy" />
    </picture>
</template>

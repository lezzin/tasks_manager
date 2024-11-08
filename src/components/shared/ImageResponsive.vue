<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { baseUrl } from '../../utils/urlUtils';

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
    <img v-if="isSmallScreen" :src="baseUrl(props.small)" :alt="props.alt" loading="lazy" />
    <img v-else :src="baseUrl(props.lg)" :alt="props.alt" loading="lazy" />
</template>

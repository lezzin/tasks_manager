<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue';
import { TOAST_TIMEOUT } from '../utils/variables';

const emit = defineEmits(['close']);

const props = defineProps({
    data: {
        type: Object,
        required: true
    }
});

const title = computed(() => {
    return props.data.type === 'error' ? 'Erro' : 'Sucesso';
});

const iconClass = computed(() => {
    return `fa-solid ${props.data.type === 'error' ? 'fa-xmark' : 'fa-check'}`;
});

const toastClass = computed(() => {
    return [
        'toast',
        props.data.show ? 'toast--active' : '',
        props.data.type ? `toast--${props.data.type}` : ''
    ].join(' ').trim();
});

let timeoutId;

onMounted(() => {
    if (props.data.type !== 'error') {
        timeoutId = setTimeout(() => {
            closeToast();
        }, TOAST_TIMEOUT);
    }
});

onBeforeUnmount(() => {
    clearTimeout(timeoutId);
});

function closeToast() {
    emit('close');
}
</script>

<template>
    <div :class="toastClass" role="alert" aria-live="assertive" aria-atomic="true" tabindex="0">
        <div class="toast__banner" aria-hidden="true"></div>

        <div class="toast__content">
            <div class="toast__icon">
                <i :class="iconClass" aria-hidden="true"></i>
            </div>

            <div>
                <p class="toast__title">{{ title }}</p>
                <p class="toast__text">{{ props.data.text }}</p>
            </div>

            <button class="btn" @click="closeToast" title="Fechar mensagem" aria-label="Fechar mensagem">
                <i class="fa-solid fa-times" aria-hidden="true"></i>
            </button>
        </div>
    </div>
</template>

<style scoped>
.toast {
    --__toast-bg: transparent;

    position: absolute;
    top: 1rem;
    right: 0;
    display: grid;
    grid-template-columns: 1.5rem 1fr;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-md);
    background-color: var(--bg-primary);
    border-radius: var(--radius);
    overflow: hidden;
    opacity: 0;
    transform: translateX(10%);
    pointer-events: none;
    transition: all var(--screen-transition) ease-in-out;

    &.toast--active {
        transform: translateX(0);
        opacity: 1;
        pointer-events: all;
    }

    &.toast--success {
        --__toast-bg: var(--details-color);
    }

    &.toast--error {
        --__toast-bg: : var(--danger-color);
    }

    .toast__banner,
    .toast__icon {
        background: var(--__toast-bg);
    }

    .toast__icon {
        font-size: 1.8rem;
    }

    .toast__content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 2rem;
        padding: 1rem 1.5rem;

        .toast__icon {
            display: grid;
            place-items: center;
            width: 2.4rem;
            aspect-ratio: 1;
            border-radius: 50%;
            color: var(--bg-primary);
        }

        .toast__title {
            font-size: 1.6rem;
            font-weight: 600;
        }

        .toast__text {
            font-size: 1.4rem;
        }

        .btn {
            align-self: flex-start;
            margin-left: 1rem;

            i {
                font-size: 1.4rem;
            }
        }
    }
}
</style>
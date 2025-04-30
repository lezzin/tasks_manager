<script setup>
import { computed, onMounted, onBeforeUnmount } from "vue";
import { TOAST_TIMEOUT } from "../../utils/variables";
import UIButton from "../ui/UIButton.vue";

const props = defineProps({
    data: {
        type: Object,
        required: true,
    },
});

const emit = defineEmits(["close"]);

const TOAST_TITLES = {
    danger: "Oops!",
    warning: "Cuidado!",
    success: "Sucesso",
};

const TOAST_ICONS = {
    warning: "exclamation",
    danger: "xmark",
    success: "check",
};

const title = computed(() => TOAST_TITLES[props.data.type]);
const iconClass = computed(() => TOAST_ICONS[props.data.type]);
const toastClass = computed(() => `toast toast--${props.data.type}`);

let timeoutId;

onMounted(() => {
    timeoutId = setTimeout(() => closeToast(), TOAST_TIMEOUT);
});

onBeforeUnmount(() => clearTimeout(timeoutId));

function closeToast() {
    emit("close");
}
</script>

<template>
    <Transition name="toast">
        <div
            :class="toastClass"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            tabindex="0"
            v-if="props.data.show"
        >
            <div class="toast__banner" aria-hidden="true"></div>
            <div class="toast__content">
                <div class="toast__icon">
                    <fa :icon="iconClass" />
                </div>
                <div>
                    <p class="toast__title">{{ title }}</p>
                    <p class="toast__text">{{ props.data.text }}</p>
                </div>

                <UIButton @click="closeToast" title="Fechar mensagem">
                    <fa icon="times" />
                </UIButton>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.toast {
    --__toast-bg: transparent;

    position: absolute;
    top: 2rem;
    right: 2rem;
    display: grid;
    grid-template-columns: 1.5rem 1fr;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-md);
    background-color: var(--bg-primary);
    border-radius: var(--radius);
    overflow: hidden;
    transition: all var(--screen-transition) ease-in-out;
    z-index: 999;
}

.toast--warning {
    --__toast-bg: var(--warning-color);
}

.toast--success {
    --__toast-bg: var(--details-color);
}

.toast--danger {
    --__toast-bg: var(--danger-color);
}

.toast__banner,
.toast__icon {
    background: var(--__toast-bg);
}

.toast__icon {
    font-size: 1.6rem;
}

.toast__content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
    padding: 1rem 1.5rem;
}

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

.toast-enter-active,
.toast-leave-active {
    transition: all var(--screen-transition) ease;
}

.toast-enter-from,
.toast-leave-to {
    opacity: 0;
    transform: translateX(1rem);
    pointer-events: none;
}
</style>

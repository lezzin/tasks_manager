<script setup>
import { ref } from "vue";

const emit = defineEmits(["trigger"]);
const props = defineProps({
    isActive: {
        type: Boolean,
        required: true,
    },
});

const toggleDropdown = () => emit("trigger");

const dropdown = ref(null);
</script>

<template>
    <div class="dropdown">
        <div class="dropdown__trigger">
            <slot name="trigger" :trigger="toggleDropdown"></slot>
        </div>

        <Transition name="dropdown">
            <div class="dropdown__menu" v-if="props.isActive" ref="dropdown">
                <slot name="menu"></slot>
            </div>
        </Transition>
    </div>
</template>

<style>
.dropdown {
    position: relative;
}

.dropdown__menu {
    position: absolute;
    top: 100%;
    right: 0;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-color);
    display: grid;
    border-radius: var(--radius);
    overflow: hidden;
    background-color: var(--bg-primary);
    transform-origin: top right;
    margin-top: 0.5rem;
    margin-right: 0.5rem;
    z-index: 990;
}

.dropdown__menu .btn {
    white-space: nowrap;
}

.dropdown-enter-active,
.dropdown-leave-active {
    transition: all var(--screen-transition) ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
    transform: scaleY(0);
    visibility: hidden;
}
</style>

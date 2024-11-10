<script setup>
const emit = defineEmits(["trigger"]);
const props = defineProps({
    isActive: {
        type: Boolean,
        required: true
    }
});

const toggleDropdown = () => {
    emit("trigger");
};
</script>

<template>
    <div class="dropdown">
        <div class="dropdown__trigger">
            <slot name="trigger" :trigger="toggleDropdown"></slot>
        </div>

        <Transition name="dropdown">
            <div class="dropdown__menu" v-if="props.isActive">
                <slot name="menu"></slot>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.dropdown {
    position: relative;

    .dropdown__menu {
        position: absolute;
        top: 100%;
        right: 0;
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--border-color);
        border-top: none;
        display: grid;
        border-radius: 0 0 var(--radius) var(--radius);
        overflow: hidden;
        background-color: var(--bg-primary);
        transform-origin: top right;
        margin-right: .5rem;
    }
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

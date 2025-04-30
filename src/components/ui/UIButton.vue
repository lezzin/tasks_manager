<script setup>
import { RouterLink } from "vue-router";
import { useAttrs } from "vue";

const props = defineProps({
    isLink: {
        type: Boolean,
        default: false,
    },
    isIcon: {
        type: Boolean,
        default: false,
    },
    isRounded: {
        type: Boolean,
        default: false,
    },
    isDropdown: {
        type: Boolean,
        default: false,
    },
    isBordered: {
        type: Boolean,
        default: false,
    },
    to: {
        type: String,
        default: "",
    },
    variant: {
        type: String,
        default: "",
    },
    type: {
        type: String,
        default: "button",
    },
});

const attrs = useAttrs();

const BUTTON_VARIANTS_CLASSES = {
    primary: "btn--primary",
    "outline-primary": "btn--outline-primary",
    "outline-primary-small": "btn--outline-primary btn--small",
    "outline-primary-smallest": "btn--outline-primary btn--smallest",

    warning: "btn--warning",

    danger: "btn--danger",
    "outline-danger": "btn--outline-danger",
    "outline-danger-small": "btn--outline-danger btn--small",
};

const getClass = () => {
    const rounded = props.isRounded ? "btn--rounded" : "";
    const icon = props.isIcon ? "btn--only-icon" : "";
    const bordered = props.isBordered ? "btn--bordered" : "";
    const dropdown = props.isDropdown ? "btn--dropdown" : "";
    return `btn ${
        BUTTON_VARIANTS_CLASSES[props.variant] ?? ""
    } ${rounded} ${bordered} ${icon} ${dropdown}`;
};
</script>

<template>
    <button
        :type="props.type"
        v-if="!props.isLink"
        :class="getClass()"
        :title="props.title"
        v-bind="attrs"
    >
        <slot></slot>
    </button>

    <RouterLink v-else :to="props.to" :class="getClass()" :title="props.title" v-bind="attrs">
        <slot></slot>
    </RouterLink>
</template>

<style scoped>
a,
button {
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: var(--radius);
    gap: 0.5rem;

    cursor: pointer;
    border: none;
    color: inherit;
    font-size: 1.6rem;
    background-color: transparent;
    padding: 0.8rem 1.6rem;
    transition: all 0.2s linear;
    white-space: nowrap;
}

a:hover,
button:hover {
    opacity: 0.8;
}

button:disabled {
    cursor: not-allowed;
    opacity: 0.8;
}

.btn--block,
.btn--block-small {
    text-align: center;
    width: 100%;
}

.btn--smallest,
.btn--small {
    padding: 0.4rem 0.8rem;
}

.btn--smallest {
    font-size: var(--fs-small);
}

.btn--primary {
    background-color: var(--details-color);
    color: var(--font-secondary);
}

.btn--outline-primary {
    border: 1px solid var(--details-color);
    background-color: var(--details-color-light-2);
    color: var(--details-color);
}

.btn--danger {
    color: var(--font-secondary);
    background-color: var(--danger-color);
}

.btn--outline-danger {
    border: 1px solid var(--danger-color);
    background-color: var(--danger-color-light);
    color: var(--danger-color);
}

.btn--warning {
    color: var(--font-primary-light);
    background-color: var(--warning-color);
}

.btn--only-icon,
.btn--rounded {
    display: grid;
    place-items: center;
    padding: 0;
    height: 3.6rem;
    aspect-ratio: 1;
}

.btn--rounded {
    border-radius: 50%;
}

.btn--dropdown {
    border: none;
    border-radius: 0;
    padding: 0.5rem 1rem;
    white-space: wrap;
}

.btn--bordered {
    border: 1px solid var(--border-color);
}
</style>

<script setup>
import { computed } from 'vue';

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

function closeToast() {
    emit('close');
}
</script>

<template>
    <div :class="toastClass">
        <div class="toast__banner"></div>

        <div class="toast__content">
            <div class="toast__icon">
                <i :class="iconClass"></i>
            </div>

            <div>
                <p class="toast__title"> {{ title }} </p>
                <p class="toast__text">{{ props.data.text }}</p>
            </div>

            <button class="btn" @click="closeToast" title="Fechar mensagem">
                <i class="fa-solid fa-times"></i>
            </button>
        </div>
    </div>
</template>

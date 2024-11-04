<script setup>
import { ref, watch, onMounted, defineProps, defineEmits } from 'vue';

const props = defineProps({
    label: {
        type: String,
        required: true
    },
    modelValue: {
        type: String,
        default: ''
    },
    errorMessage: {
        type: String,
        default: ''
    }
});

const emit = defineEmits(['update']);
let simpleMDE = null;

const updateContent = () => {
    emit('update', simpleMDE.value());
};

watch(() => props.modelValue, (newVal) => {
    simpleMDE.value(newVal);
});

onMounted(() => {
    simpleMDE = new SimpleMDE({
        element: document.querySelector('#markdown-editor'),
        spellChecker: false,
    });

    if (props.modelValue) {
        simpleMDE.value(props.modelValue);
    }
});
</script>

<template>
    <div class="form-group">
        <label class="text" for="markdown-editor">{{ label }}</label>
        <textarea id="markdown-editor" @input="updateContent"></textarea>
        <p class="text text--error" v-if="errorMessage">{{ errorMessage }}</p>
    </div>
</template>
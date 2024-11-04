<template>
    <div class="form-group">
        <label class="text" :for="editorId">{{ label }}</label>
        <textarea :id="editorId" @input="updateContent"></textarea>
        <p class="text text--error" v-if="errorMessage">{{ errorMessage }}</p>
    </div>
</template>

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

const emit = defineEmits(['update:modelValue']);
const editorId = `markdown-editor-${Math.random().toString(36).substring(2, 15)}`;
const simpleMDE = ref(null);

const updateContent = () => {
    emit('update:modelValue', simpleMDE.value.value());
};

watch(() => props.modelValue, (newVal) => {
    if (simpleMDE.value) {
        simpleMDE.value.value(newVal);
    }
});

onMounted(() => {
    simpleMDE.value = new SimpleMDE({
        element: document.querySelector(`#${editorId}`),
        spellChecker: false,
        toolbar: ["bold", "italic", "|", "unordered-list", "ordered-list", "|", "link", "image", "|", "preview", "side-by-side", "fullscreen"],
    });

    if(props.modelValue) {
        simpleMDE.value.value(props.modelValue);
    }
});
</script>

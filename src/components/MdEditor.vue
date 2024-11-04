<script setup>
import { onMounted, onBeforeUnmount, defineProps, defineEmits, watch } from 'vue';
import '@toast-ui/editor/dist/toastui-editor.css';
import { Editor } from '@toast-ui/editor';

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
const editorId = `id-${Math.random().toString(36).substr(2, 9)}`;
let editorInstance = null;

const updateContent = () => {
    if (editorInstance) {
        emit('update', editorInstance.getMarkdown());
    }
};

onMounted(() => {
    editorInstance = new Editor({
        el: document.querySelector(`#${editorId}`),
        initialEditType: 'markdown',
        previewStyle: 'vertical',
        height: '400px',
        initialValue: props.modelValue,
        events: {
            change: updateContent
        }
    });
});

onBeforeUnmount(() => {
    if (editorInstance) {
        editorInstance.destroy();
    }
});

watch(() => props.modelValue, (newValue) => {
    if (editorInstance && newValue !== editorInstance.getMarkdown()) {
        editorInstance.setMarkdown(newValue);
    }
});
</script>

<template>
    <div class="form-group">
        <label class="text" :for="editorId">{{ label }}</label>
        <div :id="editorId"></div>
        <p class="text text--error" v-if="errorMessage">{{ errorMessage }}</p>
    </div>
</template>

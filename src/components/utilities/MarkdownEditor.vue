<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
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
    },
    placeholder: {
        type: String,
        default: 'Digite aqui o comentário...'
    }
});

const emit = defineEmits(['update']);
const editorContainer = ref(null);
let editorInstance = null;

const updateContent = () => {
    if (editorInstance) {
        emit('update', editorInstance.getMarkdown());
    }
};

onMounted(() => {
    if (!editorInstance) {
        editorInstance = new Editor({
            el: editorContainer.value,
            initialEditType: 'markdown',
            previewStyle: 'vertical',
            height: '400px',
            initialValue: props.modelValue,
            placeholder: props.placeholder,
            events: {
                change: updateContent
            },
        });
    }
});

onBeforeUnmount(() => {
    if (editorInstance) {
        editorInstance.destroy();
        editorInstance = null;
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
        <label class="text">{{ label }}</label>
        <div ref="editorContainer"></div>
        <p class="text text--error" v-if="errorMessage">{{ errorMessage }}</p>
    </div>
</template>

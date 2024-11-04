<script setup>
import { onMounted, defineProps, defineEmits, watch } from 'vue';

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
let simpleMDE = null;

const updateContent = () => {
    if (simpleMDE) {
        emit('update', simpleMDE.value());
    }
};

onMounted(() => {
    simpleMDE = new SimpleMDE({
        element: document.querySelector(`#${editorId}`),
        spellChecker: false,
        placeholder: "Digite o comentário aqui..."
    });

    if (props.modelValue) {
        simpleMDE.value(props.modelValue);
    }

    simpleMDE.codemirror.on('change', updateContent);
});

watch(() => props.modelValue, (newValue) => {
    if (simpleMDE && newValue !== simpleMDE.value()) {
        simpleMDE.value(newValue);
    }
});
</script>

<template>
    <div class="form-group">
        <label class="text" :for="editorId">{{ label }}</label>
        <textarea :id="editorId"></textarea>
        <p class="text text--error" v-if="errorMessage">{{ errorMessage }}</p>
    </div>
</template>

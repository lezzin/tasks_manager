<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
    inputId: {
        type: String,
        required: true
    },
    label: {
        type: String,
        required: true
    },
    placeholder: {
        type: String,
        default: 'Adicionar...'
    },
    modelValue: {
        type: String,
        default: ''
    },
    errorMessage: {
        type: String,
        default: ''
    },
    enableVoiceRecognition: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update']);

const localValue = ref(props.modelValue);

const isListening = ref(false);
const recognition = ref(null);

const toggleSpeechRecognition = () => {
    if (!isListening.value) {
        startSpeechRecognition();
    } else {
        stopSpeechRecognition();
    }
}

const startSpeechRecognition = () => {
    isListening.value = true;
    recognition.value = new window.webkitSpeechRecognition();
    recognition.value.lang = "pt-BR";
    recognition.value.interimResults = false;

    recognition.value.onresult = (event) => {
        localValue.value = event.results[0][0].transcript;
        stopSpeechRecognition();
        updateTaskName();
    };

    recognition.value.onerror = (_event) => {
        stopSpeechRecognition();
    };

    recognition.value.onend = () => {
        isListening.value = false;
    };

    recognition.value.start();
}

const updateTaskName = () => {
    emit("update", localValue.value, '');
}

const stopSpeechRecognition = () => {
    if (recognition.value) {
        recognition.value.stop();
        recognition.value = null;
    }
    isListening.value = false;
}
</script>

<template>
    <div class="form-group">
        <label class="text" :for="inputId">{{ label }}</label>
        <div :class="['input-group', 'input-group-btn', errorMessage ? 'input-error' : '']">
            <input type="text" :id="inputId" :placeholder="placeholder" v-model="localValue" @input="updateTaskName" />
            <button v-if="enableVoiceRecognition" type="button" class="btn" title="Adicionar através de áudio"
                @click="toggleSpeechRecognition">
                <i :class="['fa-solid', isListening ? 'fa-stop' : 'fa-microphone']"></i>
            </button>
        </div>
        <p class="text text--error" v-if="errorMessage">{{ errorMessage }}</p>
    </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useToast } from "../../composables/useToast.js";
import UIButton from "../ui/UIButton.vue";

const { showToast } = useToast();

const props = defineProps({
    inputId: {
        type: String,
        required: true,
    },
    label: {
        type: String,
        required: true,
    },
    placeholder: {
        type: String,
        default: "Adicionar...",
    },
    modelValue: {
        type: String,
        default: "",
    },
    errorMessage: {
        type: String,
        default: "",
    },
    enableVoiceRecognition: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(["update"]);
const localValue = ref(props.modelValue);
const isListening = ref(false);
const recognition = ref(null);

watch(
    () => props.modelValue,
    (newValue) => {
        localValue.value = newValue;
    }
);

const toggleSpeechRecognition = () => {
    isListening.value ? stopSpeechRecognition() : startSpeechRecognition();
};

const startSpeechRecognition = () => {
    if (!window.webkitSpeechRecognition) {
        showToast("danger", "Reconhecimento de voz não suportado neste navegador.");
        return;
    }

    isListening.value = true;
    recognition.value = new window.webkitSpeechRecognition();
    recognition.value.lang = "pt-BR";
    recognition.value.interimResults = false;

    recognition.value.onresult = (event) => {
        localValue.value = event.results[0][0].transcript;
        emit("update", localValue.value);
        stopSpeechRecognition();
    };

    recognition.value.onerror = () => {
        stopSpeechRecognition();
    };

    recognition.value.onend = () => {
        isListening.value = false;
    };

    recognition.value.start();
};

const stopSpeechRecognition = () => {
    if (recognition.value) {
        recognition.value.stop();
        recognition.value = null;
    }
    isListening.value = false;
};
</script>

<template>
    <div class="form-group">
        <label class="text" :for="inputId">{{ label }}</label>
        <div :class="['input-group', 'input-group-btn', errorMessage ? 'input-error' : '']">
            <input
                type="text"
                :id="inputId"
                :placeholder="placeholder"
                v-model="localValue"
                @input="() => emit('update', localValue)"
                :aria-describedby="errorMessage"
                :aria-invalid="!!errorMessage"
            />

            <UIButton
                v-if="enableVoiceRecognition"
                title="Adicionar através de áudio"
                @click="toggleSpeechRecognition"
            >
                <fa :icon="isListening ? 'stop' : 'microphone'" />
            </UIButton>
        </div>
        <p class="text text--error" v-if="errorMessage">{{ errorMessage }}</p>
    </div>
</template>

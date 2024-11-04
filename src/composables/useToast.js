import { reactive } from 'vue';
import { TOAST_TIMEOUT } from '../utils/variables';

const toast = reactive({
    show: false,
    type: 'success',
    text: ''
});

function showToast(type = 'success', message) {
    toast.type = type;
    toast.text = message;
    toast.show = true;

    setTimeout(() => {
        toast.show = false;
    }, TOAST_TIMEOUT);
}

function closeToast() {
    toast.show = false;
}

export function useToast() {
    return {
        toast,
        showToast,
        closeToast
    };
}

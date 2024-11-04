import { reactive } from 'vue';

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
    }, 3000);
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

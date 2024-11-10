<script setup>
import UIModal from '../ui/UIModal.vue';

const emit = defineEmits(["close"]);

const props = defineProps({
    comment: {
        type: String,
        required: false
    }
})

const closeShowingComment = () => {
    emit("close");
}
</script>

<template>
    <UIModal @close="closeShowingComment" titleId="comment-modal-title">
        <template #title>Comentários da tarefa</template>

        <template #body>
            <div class="markdown-content markdown-content--normal" v-html="props.comment" aria-live="polite"
                aria-describedby="comment-modal-title" role="document">
            </div>
        </template>
    </UIModal>
</template>

<style scoped>
.markdown-content {
    overflow-y: auto;
    padding: var(--padding);
}

.markdown-content a {
    word-break: break-all;
    padding: var(--padding);
}
</style>
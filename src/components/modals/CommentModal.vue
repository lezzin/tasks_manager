<script setup>
import BaseModal from '../ui/BaseModal.vue';
import UIButton from '../ui/UIButton.vue';


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
    <BaseModal @close="closeShowingComment" titleId="comment-modal-title">
        <template #title>Comentários da tarefa</template>

        <template #body>
            <div class="markdown-content markdown-content--normal" v-html="props.comment" aria-live="polite"
                aria-describedby="comment-modal-title" role="document">
            </div>
        </template>
    </BaseModal>
</template>

<style scoped>
.markdown-content {
    overflow-y: auto;
    padding: var(--padding);
    word-break: break-all;
}
</style>
<script setup>

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
    <aside class="modal" role="dialog" aria-modal="true" aria-labelledby="comment-modal-title">
        <div class="modal__dialog">
            <div class="modal__header">
                <h2 id="comment-modal-title" class="modal__title">Comentários da tarefa</h2>
                <button class="btn" @click="closeShowingComment" title="Fechar modal"
                    aria-label="Fechar visualização de comentários">
                    <i class="fa-solid fa-times" aria-hidden="true"></i>
                </button>
            </div>

            <div class="markdown-content markdown-content--normal" v-html="props.comment" aria-live="polite"
                aria-describedby="comment-modal-title" role="document">
            </div>
        </div>
    </aside>
</template>

<style scoped>
.markdown-content {
    overflow-y: auto;
    padding: var(--padding);
    word-break: break-all;

    >* {
        padding-top: 0;
        margin-top: 0;

        &:last-child {
            padding-bottom: 0;
            margin-bottom: 0;
        }
    }
}
</style>
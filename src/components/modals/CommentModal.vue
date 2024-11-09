<script setup>
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
    <aside class="modal" role="dialog" aria-modal="true" aria-labelledby="comment-modal-title">
        <div class="modal__dialog">
            <div class="modal__header">
                <h2 id="comment-modal-title" class="modal__title">Comentários da tarefa</h2>

                <UIButton @click="closeShowingComment" title="Fechar modal">
                    <fa icon="times" />
                </UIButton>
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
}
</style>
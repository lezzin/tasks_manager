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
    <aside class="modal">
        <div class="modal__dialog">
            <div class="modal__header">
                <h2 class="modal__title">Comentários da tarefa</h2>
                <button class="btn" @click="closeShowingComment" title="Fechar modal">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>

            <div class="markdown-content markdown-content--normal" v-html="props.comment"></div>
        </div>
    </aside>
</template>
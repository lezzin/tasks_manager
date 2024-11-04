<template>
    <aside :class="['modal', showingComment && 'active']">
        <div class="modal__dialog">
            <div class="modal__header">
                <h2 class="modal__title">Comentários da tarefa</h2>
                <button class="btn" @click="closeShowingComment" title="Fechar modal">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>

            <div class="markdown-content markdown-content--normal" v-html="selectedComment"></div>
        </div>
    </aside>
</template>
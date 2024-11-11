<script setup>
import { RouterView } from 'vue-router';

import { useToast } from './composables/useToast';

import LoaderContainer from './components/shared/LoaderContainer.vue';
import ToastFeedback from './components/shared/ToastFeedback.vue';
import MyHeader from './components/layout/MyHeader.vue';

const { toast, closeToast } = useToast();
</script>

<template>
    <LoaderContainer />

    <MyHeader />

    <main>
        <RouterView></RouterView>
    </main>

    <Teleport to="#toast">
        <ToastFeedback :data="toast" @close="closeToast" />
    </Teleport>
</template>

<style>
.btn.account {
    display: flex;
    align-items: center;
    gap: .5rem;
    padding: 0.3rem 0.3rem 0.3rem 1rem;
    cursor: pointer;
    background-color: var(--bg-secondary);

    .account__details {
        text-align: right;

        .text--small {
            font-weight: 500;
        }
    }

    @media(width <=768px) {
        .account__details {
            display: none;
        }
    }

    .account__avatar {
        border-radius: 50%;
        border: 1px solid var(--border-color);
    }

    .account__arrow {
        transform: translateY(-2px);
        margin-inline: 0.5rem;
    }
}
</style>
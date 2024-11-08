<script setup>
import { useLoadingStore } from '../stores/loadingStore';

import { inject, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import PomodoroTimer from '../components/pomodoro/PomodoroTimer.vue';
import PomodoroInformation from '../components/pomodoro/PomodoroInformation.vue';

const loadingStore = useLoadingStore();
const router = useRouter();

const goToHelp = () => {
    window.scroll({
        top: document.querySelector("#s-help").getBoundingClientRect().top + window.scrollY,
        behavior: "smooth"
    })
}

const canShakeButton = ref(false);
let shakeTimeout;

const warnUser = () => {
    if (canShakeButton.value) return;

    canShakeButton.value = true;
    if (shakeTimeout) clearTimeout(shakeTimeout);
    shakeTimeout = setTimeout(() => canShakeButton.value = false, 1500);
}

onMounted(() => {
    inject('showTopicNavBtn').value = false;
    loadingStore.hideLoader();
});
</script>

<template>
    <section class="pomodoro-wrapper" id="s-pomodoro">
        <div class="container">
            <div class="pomodoro__absolute">
                <button type="button" @click="() => router.back()" class="btn-back btn btn--outline-primary btn--icon "
                    title="Voltar para a página anterior" aria-label="Voltar para a página anterior">
                    <fa icon="arrow-left" />
                    <span>Voltar</span>
                </button>
                <button type="button" class="btn btn--only-icon btn--outline-primary" title="Acessar ajuda"
                    @click="goToHelp">
                    <fa icon="circle-question" />
                </button>
            </div>

            <PomodoroTimer :canShakeButton="canShakeButton" :warn="warnUser" />
        </div>
    </section>

    <section class="information-wrapper container" id="s-help">
        <PomodoroInformation :warn="warnUser" :canShakeButton="canShakeButton" />
    </section>
</template>

<style scoped>
.pomodoro-wrapper {
    color: var(--details-color);
    background: var(--details-color-light);
    background: -webkit-linear-gradient(to right, var(--details-color-light-2), var(--details-color-light));
    background: linear-gradient(to right, var(--details-color-light-2), var(--details-color-light));
}

.pomodoro-wrapper .container {
    position: relative;
    display: grid;
    place-items: center;
    min-height: 100vh;
}

.pomodoro__absolute {
    position: absolute;
    top: 1.5rem;
    right: var(--padding);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.pomodoro__absolute button {
    padding: 0.64rem 1rem;
}

.pomodoro__absolute .btn--only-icon i {
    font-size: 1.6rem;
}

.information-wrapper {
    display: grid;
    place-items: center;
    max-width: 720px;
    min-height: 90vh;
    padding: calc(var(--padding) * 2) var(--padding);
}
</style>
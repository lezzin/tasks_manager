<script setup>
import { useLoadingStore } from '../stores/loadingStore';
import { useSidebarStore } from '../stores/sidebarStore';

import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

import PomodoroTimer from '../components/pomodoro/PomodoroTimer.vue';
import PomodoroInformation from '../components/pomodoro/PomodoroInformation.vue';
import UIButton from '../components/ui/UIButton.vue';

const loadingStore = useLoadingStore();
const sidebarStore = useSidebarStore();
const router = useRouter();

const goToHelp = () => {
    window.scroll({
        top: document.querySelector("#s-help").getBoundingClientRect().top + window.scrollY,
        behavior: "smooth"
    })
}

onMounted(() => {
    sidebarStore.setShowSidebarToggler(false);
    loadingStore.hideLoader();
});
</script>

<template>
    <section class="pomodoro-wrapper" id="s-pomodoro">
        <div class="container">
            <div class="pomodoro__absolute">
                <UIButton @click="() => router.back()" variant="outline-primary" title="Voltar para a página anterior">
                    <fa icon="arrow-left" />
                    <span>Voltar</span>
                </UIButton>
                <UIButton variant="outline-primary" isIcon title="Acessar ajuda" @click="goToHelp">
                    <fa icon="circle-question" />
                </UIButton>
            </div>

            <PomodoroTimer />
        </div>
    </section>

    <section class="information-wrapper container" id="s-help">
        <PomodoroInformation />
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
    padding: 0.74rem 1rem;
}

.information-wrapper {
    display: grid;
    place-items: center;
    max-width: 720px;
    min-height: 90vh;
    padding: calc(var(--padding) * 2) var(--padding);
}
</style>
<script setup>
import { useLoadingStore } from '../stores/loadingStore';
import { useToast } from '../composables/useToast';

import { inject, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import PomodoroTasks from '../components/task/PomodoroTasks.vue';

const TIME_CONSTANTS = {
    ONE_SECOND: 1000,
    WORK: { minutes: 24, seconds: 59 },
    SHORT_BREAK: { minutes: 5, seconds: 0 },
    LONG_BREAK: { minutes: 15, seconds: 0 },
    CYCLES_BEFORE_LONG_BREAK: 4
};

const loadingStore = useLoadingStore();
const { showToast } = useToast();
const router = useRouter();

const hasSelectedTask = ref(false);

const timer = reactive({
    minutes: TIME_CONSTANTS.WORK.minutes,
    seconds: TIME_CONSTANTS.WORK.seconds,
    active: false,
    paused: false,
    cycleCount: 0,
    onBreak: false
});

const canShakeButton = ref(false);
let shakeTimeout;

const warnUser = () => {
    if (canShakeButton.value) return;

    canShakeButton.value = true;
    if (shakeTimeout) clearTimeout(shakeTimeout);
    shakeTimeout = setTimeout(() => canShakeButton.value = false, 1500);
}

let timerInterval;

const startPomodoro = () => {
    if (!hasSelectedTask.value) {
        warnUser();
        showToast("warning", "Selecione uma tarefa antes!");
        return;
    }

    if (timer.active && !timer.paused) return;

    timer.active = true;
    timer.paused = false;

    timerInterval = setInterval(runTimer, TIME_CONSTANTS.ONE_SECOND);
}

const runTimer = () => {
    if (timer.seconds === 0) {
        if (timer.minutes === 0) {
            handleCycleEnd();
        } else {
            timer.minutes--;
            timer.seconds = 59;
        }
    } else {
        timer.seconds--;
    }
}

const pausePomodoro = () => {
    if (timerInterval) clearInterval(timerInterval);
    timer.paused = true;
}

const stopPomodoro = () => {
    if (!confirm("Tem certeza que deseja parar o timer?")) return;

    clearTimer();
    resetTimer();
}

const handleCycleEnd = () => {
    timer.onBreak ? startWorkCycle() : prepareNextCycle();
}

const prepareNextCycle = () => {
    timer.cycleCount++;

    if (timer.cycleCount % TIME_CONSTANTS.CYCLES_BEFORE_LONG_BREAK === 0) {
        startLongBreak();
        return;
    }

    startShortBreak();
}

const startWorkCycle = () => {
    timer.onBreak = false;
    setTimer(TIME_CONSTANTS.WORK.minutes, TIME_CONSTANTS.WORK.seconds);
}

const startShortBreak = () => {
    timer.onBreak = true;
    setTimer(TIME_CONSTANTS.SHORT_BREAK.minutes, TIME_CONSTANTS.SHORT_BREAK.seconds);
}

const startLongBreak = () => {
    timer.onBreak = true;
    setTimer(TIME_CONSTANTS.LONG_BREAK.minutes, TIME_CONSTANTS.LONG_BREAK.seconds);
}

const resetTimer = () => {
    timer.minutes = TIME_CONSTANTS.WORK.minutes;
    timer.seconds = TIME_CONSTANTS.WORK.seconds;
    timer.cycleCount = 0;
    timer.onBreak = false;
}

const setTimer = (minutes, seconds) => {
    timer.minutes = minutes;
    timer.seconds = seconds;
}

const clearTimer = () => {
    clearInterval(timerInterval);
    timer.active = false;
    timer.paused = false;
}

const selectTask = (taskSelected) => {
    hasSelectedTask.value = Boolean(taskSelected);
}

const formatTime = (time) => {
    return time < 10 ? '0' + time : time;
}

const goBack = () => {
    router.back();
}

const goToHelp = () => {
    window.scroll({
        top: document.querySelector("#s-help").getBoundingClientRect().top + window.scrollY,
        behavior: "smooth"
    })
}

const goToPomodoro = () => {
    window.scroll({
        top: 0,
        behavior: "smooth"
    })

    warnUser();
}

onMounted(() => {
    inject('showTopicNavBtn').value = false;
    loadingStore.hideLoader();
});

watch(hasSelectedTask, () => {
    if (timer.active) {
        pausePomodoro();
    }
})

</script>

<template>
    <section class="pomodoro-wrapper" id="s-pomodoro">
        <div class="container">
            <div class="pomodore__absolute">
                <button type="button" @click="goBack" class="btn-back btn btn--outline-primary btn--icon "
                    title="Voltar para o início" aria-label="Voltar para a página inicial">
                    <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
                    <span>Voltar para a página inicial</span>
                </button>
                <button type="button" class="btn btn--only-icon btn--outline-primary" title="Acessar ajuda"
                    @click="goToHelp">
                    <i class="fa-regular fa-circle-question"></i>
                </button>
            </div>

            <div class="pomodoro">
                <div class="pomodoro__cycle-info">
                    Ciclo: {{ timer.cycleCount }} | {{ timer.onBreak ? 'Intervalo' : 'Trabalho' }}
                </div>

                <span class="pomodoro__timer">
                    {{ formatTime(timer.minutes) }}:{{ formatTime(timer.seconds) }}
                </span>

                <div class="pomodoro__buttons">
                    <button class="btn btn--primary btn--icon" @click="startPomodoro"
                        v-if="!timer.active && !timer.paused">
                        <i class="fa-solid fa-play"></i>
                        Iniciar
                    </button>
                    <button class="btn btn--warning btn--icon" @click="pausePomodoro"
                        v-if="timer.active && !timer.paused">
                        <i class="fa-solid fa-pause"></i>
                        Pausar
                    </button>
                    <button class="btn btn--primary btn--icon" @click="startPomodoro" v-if="timer.paused">
                        <i class="fa-solid fa-play"></i>
                        Continuar
                    </button>
                    <button class="btn btn--danger btn--icon" @click="stopPomodoro" v-if="timer.active">
                        <i class="fa-regular fa-circle-stop"></i>
                        Parar
                    </button>
                </div>

                <PomodoroTasks @update="selectTask" :canShake="canShakeButton" />
            </div>
        </div>
    </section>

    <section class="information-wrapper container" id="s-help">
        <div class="information">
            <article class="information-block">
                <h2 class="title">O que é o método Pomodoro?</h2>
                <p class="text">
                    O método Pomodoro é uma técnica de gerenciamento de tempo desenvolvida para melhorar a
                    produtividade. Criado pelo italiano Francesco Cirillo nos anos 1980, ele se baseia em dividir o
                    tempo de trabalho em ciclos curtos e focados, seguidos de intervalos de descanso.
                </p>
            </article>

            <article class="information-block">
                <h3 class="subtitle">Como funciona:</h3>

                <ol class="steps text">
                    <li>Escolha uma tarefa para trabalhar.</li>
                    <li>Ajuste um timer para 25 minutos (esse período é chamado de "Pomodoro").</li>
                    <li>Trabalhe na tarefa até o timer tocar, sem interrupções.</li>
                    <li>Após os 25 minutos, faça uma pausa curta de 5 minutos.</li>
                    <li>Após completar quatro pomodoros, faça uma pausa mais longa, de 15 a 30 minutos.</li>
                </ol>

                <p class="text">
                    Esse método ajuda a manter o foco e reduzir a procrastinação, criando uma sensação de urgência
                    para
                    completar as tarefas dentro de um tempo definido.
                </p>

                <button class="btn btn--outline-primary" @click="goToPomodoro">Começar agora!</button>
            </article>
        </div>
    </section>
</template>

<style scoped>
.pomodoro-wrapper {
    background: var(--details-color-light);
    background: -webkit-linear-gradient(to right, var(--details-color-light-2), var(--details-color-light));
    background: linear-gradient(to right, var(--details-color-light-2), var(--details-color-light));
}

.pomodoro-wrapper .container {
    position: relative;
    display: grid;
    place-items: center;
    min-height: 90vh;
}

.pomodore__absolute {
    position: absolute;
    top: 1.5rem;
    right: 50%;
    transform: translateX(50%);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.pomodore__absolute button {
    padding: 0.64rem 1rem;
}

.pomodore__absolute .btn--only-icon i {
    font-size: 1.6rem;
}

.pomodoro {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    width: 100%;
}

.pomodoro__timer {
    color: var(--details-color);
    font-size: clamp(8rem, 20vw, 12rem);
    font-weight: 500;
    margin-bottom: 2rem;
}

.pomodoro__buttons {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
}

.pomodoro__buttons button {
    padding: .8rem 2rem;
    text-transform: uppercase;
    font-size: 1.8rem;
    margin-bottom: 5rem;
}

.pomodoro__cycle-info {
    color: var(--details-color);
    font-size: 1.6rem;
    font-weight: 500;
}

.information-wrapper {
    display: grid;
    place-items: center;
    max-width: 720px;
    min-height: 90vh;
    padding: calc(var(--padding) * 2) var(--padding);
}

.information {
    display: grid;
    gap: 3rem;
}

.information-block {
    display: grid;
    justify-items: flex-start;
    gap: 1rem;
}

.information-block button {
    margin-top: 2rem;
    padding: 0.5rem 1rem;
}

.information .steps {
    margin-left: 2rem;
}
</style>
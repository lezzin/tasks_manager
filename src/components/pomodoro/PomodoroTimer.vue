<script setup>
import PomodoroTasks from './PomodoroTasks.vue';
import { reactive, ref, watch } from 'vue';
import { useToast } from '../../composables/useToast';
import UIButton from '../ui/UIButton.vue';

const { showToast } = useToast();

const TIME_CONSTANTS = {
    ONE_SECOND: 1000,
    WORK: { minutes: 24, seconds: 59 },
    SHORT_BREAK: { minutes: 5, seconds: 0 },
    LONG_BREAK: { minutes: 15, seconds: 0 },
    CYCLES_BEFORE_LONG_BREAK: 4,
    PAUSE_PER_CYCLE_IN_MINUTES: 5
};

const timer = reactive({
    minutes: TIME_CONSTANTS.WORK.minutes,
    seconds: TIME_CONSTANTS.WORK.seconds,
    active: false,
    paused: false,
    cycleCount: 1,
    onBreak: false
});
let timerInterval;

const startPomodoro = () => {
    if (timer.active && !timer.paused) return;

    timer.active = true;
    timer.paused = false;

    clearInterval(timerInterval);
    timerInterval = setInterval(runTimer, TIME_CONSTANTS.ONE_SECOND);
};

const runTimer = () => {
    if (timer.seconds > 0) {
        timer.seconds--;
        return;
    }

    if (timer.minutes === 0) {
        handleCycleEnd();
        return;
    }

    timer.minutes--;
    timer.seconds = 59;
};

const pausePomodoro = () => {
    if (timerInterval) clearInterval(timerInterval);
    timer.paused = true;
};

const stopPomodoro = () => {
    if (!confirm("Tem certeza que deseja parar o timer?")) return;

    clearTimer();
    resetTimer();
};

const handleCycleEnd = () => {
    timer.onBreak ? startWorkCycle() : prepareNextCycle();
    showToast("success", "Ciclo concluído!");

    clearInterval(timerInterval);
    timer.active = false;
};

const prepareNextCycle = () => {
    timer.cycleCount++;

    if (timer.cycleCount % TIME_CONSTANTS.CYCLES_BEFORE_LONG_BREAK === 0) {
        startLongBreak();
        return;
    }

    startShortBreak();
};

const startWorkCycle = () => {
    timer.onBreak = false;
    setTimer(TIME_CONSTANTS.WORK.minutes, TIME_CONSTANTS.WORK.seconds);
};

const startShortBreak = () => {
    timer.onBreak = true;
    setTimer(TIME_CONSTANTS.SHORT_BREAK.minutes, TIME_CONSTANTS.SHORT_BREAK.seconds);
};

const startLongBreak = () => {
    timer.onBreak = true;
    setTimer(TIME_CONSTANTS.LONG_BREAK.minutes, TIME_CONSTANTS.LONG_BREAK.seconds);
};

const resetTimer = () => {
    setTimer(TIME_CONSTANTS.WORK.minutes, TIME_CONSTANTS.WORK.seconds);
    timer.cycleCount = 1;
    timer.onBreak = false;
};

const setTimer = (minutes, seconds) => {
    timer.minutes = minutes;
    timer.seconds = seconds;
};

const clearTimer = () => {
    clearInterval(timerInterval);
    timer.active = false;
    timer.paused = false;
};

const formatTime = (time) => {
    return time < 10 ? '0' + time : time;
};
</script>

<template>
    <div class="pomodoro">
        <div class="pomodoro__cycle-info">
            Ciclo: {{ timer.cycleCount }} | {{ timer.onBreak ? 'Intervalo' : 'Trabalho' }}
        </div>

        <span class="pomodoro__timer">
            {{ formatTime(timer.minutes) }}:{{ formatTime(timer.seconds) }}
        </span>

        <div class="pomodoro__buttons">
            <UIButton variant="primary" @click="startPomodoro" v-if="!timer.active && !timer.paused">
                <fa icon="play" /> Iniciar
            </UIButton>

            <UIButton variant="warning" @click="pausePomodoro" v-if="timer.active && !timer.paused">
                <fa icon="pause" /> Pausar
            </UIButton>

            <UIButton variant="primary" @click="startPomodoro" v-if="timer.paused">
                <fa icon="play" /> Continuar
            </UIButton>

            <UIButton variant="danger" @click="stopPomodoro" v-if="timer.active">
                <fa icon="circle-stop" /> Parar
            </UIButton>
        </div>

        <PomodoroTasks />
    </div>
</template>

<style scoped>
.pomodoro {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    width: 100%;
}

.pomodoro__timer {
    font-size: clamp(8rem, 20vw, 12rem);
    font-weight: 600;
    color: var(--details-color-dark);
    margin-bottom: 2rem;
    font-variant-numeric: tabular-nums;
}

.pomodoro__buttons {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
}

.pomodoro__buttons button {
    text-transform: uppercase;
    font-weight: 500;
    font-size: 1.8rem;
    padding: .8rem 2rem;
    margin-bottom: 5rem;
    box-shadow: 0 .5rem 1rem rgb(0 0 0 / 15%);
}

.pomodoro__cycle-info {
    font-size: 1.6rem;
    font-weight: 500;
}
</style>
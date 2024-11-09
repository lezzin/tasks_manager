<script setup>
import UIButton from '../ui/UIButton.vue';

const goToPomodoro = () => {
    window.scroll({
        top: 0,
        behavior: "smooth"
    })
}
</script>
<template>
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

            <UIButton variant="outline-primary" @click="goToPomodoro" title="Iniciar o Pomodoro Timer">
                Começar agora!
            </UIButton>
        </article>
    </div>
</template>

<style scoped>
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
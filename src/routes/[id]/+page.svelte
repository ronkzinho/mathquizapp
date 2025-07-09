<script lang="ts">
    import Question from '@/components/Question.svelte';
    import { createQuestions } from '@/util/applab.js';
    import {
        format,
        formatDistanceStrict,
        formatDistanceToNow,
        isAfter,
        setDefaultOptions,
        subDays
    } from 'date-fns';
    import { ptBR as pt } from 'date-fns/locale';

    setDefaultOptions({ locale: pt });

    export let data: {
        seed: string;
        time: number;
        quizStarted: string;
        eachQuestionTime: string[];
    };

    let { seed, time, quizStarted, eachQuestionTime } = data;

    const { alternatives, answers, questions, seeds } = createQuestions(seed);

    let currentQuestionIndex = 0;
    let clipboard = () => {
        navigator.clipboard.writeText(seed);
        alert('Seed copiada para a área de transferência!');
    };

    const handleKeydown = (event: KeyboardEvent) => {
        if (
            event.key === 'ArrowRight' &&
            currentQuestionIndex < questions.length - 1
        ) {
            currentQuestionIndex++;
        } else if (event.key === 'ArrowLeft' && currentQuestionIndex > 0) {
            currentQuestionIndex--;
        }
    };

    export {
        seed,
        quizStarted,
        eachQuestionTime,
        time,
        alternatives,
        currentQuestionIndex,
        questions,
        answers,
        seeds
    };
</script>

<svelte:head>
    <title>Seed: {seed}</title>
</svelte:head>
<svelte:window on:keydown={handleKeydown} />

<div class="header">
    <h1 class="prefix">
        Seed: <button class="seedButton" on:click={clipboard}>{seed}</button>
    </h1>
    <h1 class="prefix">
        Questão nº <span style="color: yellow">{currentQuestionIndex + 1}</span>
    </h1>
    <h1 class="prefix">
        Tempo:
        <span style="color: cornflowerblue"
            >{formatDistanceStrict(
                new Date(time + parseInt(quizStarted)),
                new Date(parseInt(quizStarted)),
                {
                    locale: pt,
                    unit: 'second',
                    roundingMethod: 'floor'
                }
            )}</span
        >
    </h1>
</div>
<div class="questionSlider">
    <button
        class="sliderButton"
        disabled={currentQuestionIndex === 0}
        on:click={() => {
            currentQuestionIndex--;
        }}>&lt</button
    >
    <Question
        answer={answers[currentQuestionIndex]}
        question={questions[currentQuestionIndex]}
        questionTime={eachQuestionTime[currentQuestionIndex]}
        lastQuestionTime={eachQuestionTime[currentQuestionIndex - 1] ??
            quizStarted}
    />
    <button
        class="sliderButton"
        disabled={currentQuestionIndex === questions.length - 1}
        on:click={() => {
            currentQuestionIndex++;
        }}>&gt</button
    >
</div>

<span
    class="date-display"
    title={isAfter(
        new Date(time + parseInt(quizStarted)),
        subDays(new Date(), 7)
    )
        ? ''
        : formatDistanceToNow(new Date(time + parseInt(quizStarted)), {
              addSuffix: true
          }).replace(/^./, (c) => c.toUpperCase())}
>
    {(isAfter(new Date(time + parseInt(quizStarted)), subDays(new Date(), 7))
        ? formatDistanceToNow(new Date(time + parseInt(quizStarted)), {
              addSuffix: true
          })
        : format(
              new Date(time + parseInt(quizStarted)),
              "dd 'de' MMMM 'de' yyyy",
              {}
          )
    ).replace(/^./, (c) => c.toUpperCase())}
</span>

<p class="madeBy">Feito por Henrique</p>
<a href="/"><button class="back">Voltar</button></a>

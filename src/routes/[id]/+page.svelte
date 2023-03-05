<script async lang="ts" setup>
  import { page } from '$app/stores';
  import { formatDistanceStrict } from 'date-fns';
  /// <reference types="../../types/fnsLocale.d.ts" />
  import { ptBR as pt } from 'date-fns/locale/index.js';
  import Question from '@/components/Question.svelte';
  import { createQuesions } from '@/util/applab';
  import '@/global.css';

  let { seed, time, quizStarted, eachQuestionTime } = $page.data as {
    seed: string;
    time: number;
    quizStarted: string;
    eachQuestionTime: string[];
  };

  const { alternatives, answers, questions, seeds } = createQuesions(seed);

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
    <span style="color: blue"
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
    lastQuestionTime={eachQuestionTime[currentQuestionIndex - 1] ?? quizStarted}
  />
  <button
    class="sliderButton"
    disabled={currentQuestionIndex === questions.length - 1}
    on:click={() => {
      currentQuestionIndex++;
    }}>&gt</button
  >
</div>

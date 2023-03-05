<script lang="ts">
  import { formatDistanceStrict } from 'date-fns';
  import { ptBR as pt } from 'date-fns/locale';

  export let question: string;
  export let answer: string | number;
  export let questionTime: string;
  export let lastQuestionTime: string;
  //   export let slidersRefs: HTMLButtonElement[];

  let handleMove = (e: MouseEvent) => {
    const target = e.currentTarget! as HTMLDivElement;
    const rect = target.getBoundingClientRect(),
      x = e.clientX - rect.left,
      y = e.clientY - rect.top;
    target.style.setProperty('--mouse-x', x + 'px');
    target.style.setProperty('--mouse-y', y + 'px');

    // slidersRefs.forEach((slider) => {
    //   slider.style.setProperty('--mouse-x', e.clientX + 'px');
    //   slider.style.setProperty('--mouse-y', e.clientY + 'px');
    // });
  };
</script>

<div class="question" on:mousemove={handleMove}>
  <div class="question-content">
    <h1 class="prefix">
      Questão: <span style="color: white; font-family: sans-serif"
        >{question}</span
      >
    </h1>
    <h2 class="prefix">
      Resposta: <span style="color: white; font-family: sans-serif"
        >{answer}</span
      >
    </h2>
    <p class="prefix">
      Tempo demorado para responder a questão: <span style="color: white">
        {parseInt(questionTime) - parseInt(lastQuestionTime) >= 1000
          ? formatDistanceStrict(
              parseInt(questionTime),
              parseInt(lastQuestionTime),
              {
                locale: pt
              }
            )
          : parseInt(questionTime) - parseInt(lastQuestionTime) + 'ms'}
      </span>
    </p>
  </div>
</div>

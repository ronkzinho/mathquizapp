<script lang="ts">
    import { formatDistanceStrict } from 'date-fns';
    /// <reference types="../types/fnsLocale.d.ts" />

    export let question: string;
    export let answer: string | number;
    export let questionTime: string;
    export let lastQuestionTime: string;
    export let setSeed: boolean;
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

<div
    class={`question ${!setSeed ? 'randomSeed' : ''}`}
    on:mousemove={handleMove}
    role="region"
    aria-label="Question details"
>
    <div class="question-content">
        <h2 class="prefix">
            Questão: <span class="questionString">{question}</span>
        </h2>
        <h2 class="prefix">
            Resposta: <span class="answer">{answer}</span>
        </h2>
        <h2 class="prefix">
            Tempo: <span class="questionTime">
                {parseInt(questionTime) - parseInt(lastQuestionTime) >= 1000
                    ? formatDistanceStrict(
                          parseInt(questionTime),
                          parseInt(lastQuestionTime)
                      )
                          .replace('segundos', 's')
                          .replace('segundo', 's')
                    : parseInt(questionTime) -
                      parseInt(lastQuestionTime) +
                      ' ms'}
            </span>
        </h2>
    </div>
</div>

import Question from '@/components/Question.svelte';
import redis from '@lib/redis';
import { questionSchema } from '@lib/schema';
import { redirect, type Load } from '@sveltejs/kit';

export const ssr = true;

export const load: Load = async ({ url }) => {
  let seed = url.searchParams.get('seed');
  let time = parseInt(url.searchParams.get('time')!);
  let quizStarted = url.searchParams.get('quizStarted');
  let eachQuestionTime = url.searchParams.get('eachQuestionTime')?.split(',')!;

  const quizData = {
    seed,
    time,
    quizStarted,
    eachQuestionTime
  };

  if (quizData instanceof Question) return;

  try {
    const details = questionSchema.parse(quizData);

    const id = ((await redis.incr('stats')) || 0).toString();
    await redis.set(id, JSON.stringify(details));

    throw redirect(302, url.href.split('?')[0] + id);
  } catch (err) {}
};

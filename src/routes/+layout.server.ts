import redis from '@lib/redis';
import { questionSchema } from '@lib/schema';
import { error, redirect, type Load } from '@sveltejs/kit';

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

  if (!seed || !time || !quizStarted || !eachQuestionTime) return;

  let id = 0;

  try {
    const details = questionSchema.parse(quizData);
    id = (await redis.incr('stats')) || 0;
    await redis.set(id.toString(), JSON.stringify(details));
  } catch (err) {
    error(400, 'Something went wrong!');
  }

  throw redirect(301, url.href.split('?')[0] + id);
};

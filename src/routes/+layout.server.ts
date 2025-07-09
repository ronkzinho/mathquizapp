import redis from '@lib/redis';
import { questionSchema, type Question } from '@lib/schema';
import { error, redirect, type Load } from '@sveltejs/kit';

export const ssr = true;

export const load: Load = async ({ url }) => {
  const seed = url.searchParams.get('seed');
  const time = parseInt(url.searchParams.get('time')!);
  const quizStarted = url.searchParams.get('quizStarted');
  const eachQuestionTime = decodeURIComponent(
    url.searchParams.get('eachQuestionTime')!
  ).split(',')!;

  type NullableQuestion = {
    [K in keyof Question]?: Question[K] | null;
  };

  const quizData: NullableQuestion = {
    seed,
    time,
    quizStarted,
    eachQuestionTime
  };

  const setSeed = url.searchParams.get('setSeed');

  if (setSeed !== null) {
    quizData.setSeed = setSeed === 'true';
  }

  if (!seed || !time || !quizStarted || !eachQuestionTime) return;

  let id = 0;

  try {
    const details = questionSchema.parse(quizData);

    const length = await redis.hlen('details');
    id = length === 0 || !length ? 0 : length + 1;
    console.log(await redis.hsetnx('details', id.toString(), details));
  } catch (err) {
    console.log(err);
    error(400, 'Something went wrong!');
  }

  throw redirect(301, url.href.split('?')[0] + id);
};

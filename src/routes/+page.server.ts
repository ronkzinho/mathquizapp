import { redirect, type Load } from '@sveltejs/kit';

import { env } from '$env/dynamic/public';

export const ssr = true;
export const load: Load = async ({ url }) => {
  if (
    !url.searchParams.has('seed') ||
    !url.searchParams.has('time') ||
    !url.searchParams.has('quizStarted') ||
    !url.searchParams.has('eachQuestionTime')
  ) {
    return;
  }
  let seed = url.searchParams.get('seed');
  let time = parseInt(url.searchParams.get('time')!);
  let quizStarted = url.searchParams.get('quizStarted');
  let eachQuestionTime = url.searchParams.get('eachQuestionTime')?.split(',')!;

  if (
    seed !== undefined &&
    time !== undefined &&
    quizStarted !== undefined &&
    !!eachQuestionTime &&
    eachQuestionTime!.length === 10
  ) {
    const id = await fetch(env.PUBLIC_WORKER_URL, {
      method: 'POST',
      body: JSON.stringify({
        time,
        quizStarted,
        eachQuestionTime,
        seed
      })
    }).then((res) => res.json());

    throw redirect(300, url.href.split('?')[0] + '/' + id);
  }
};

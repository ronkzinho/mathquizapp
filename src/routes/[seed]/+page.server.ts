import { redirect, type Load } from '@sveltejs/kit';

import { env } from '$env/dynamic/public';

export const ssr = true;
export const load: Load = async ({ url, params }) => {
  let time = parseInt(url.searchParams.get('time') || '0');
  let quizStarted = url.searchParams.get('quizStarted') || '0';
  let eachQuestionTime =
    url.searchParams.get('eachQuestionTime')?.split(',') || [];
  if (
    time === undefined ||
    quizStarted === undefined ||
    eachQuestionTime.length === undefined
  )
    throw redirect(302, '/');

  const id = await fetch(env.PUBLIC_WORKER_URL, {
    method: 'POST',
    body: JSON.stringify({
      time,
      quizStarted,
      eachQuestionTime,
      seed: params.seed
    })
  }).then((res) => res.json());

  throw redirect(302, url.href.split('?')[0] + '/' + id);
};

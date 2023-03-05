import { env } from '$env/dynamic/public';
import type { Load } from '@sveltejs/kit';

export const ssr = true;
export const load: Load = async ({ params }) => {
  return {
    ...(await fetch(env.PUBLIC_WORKER_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        id: params.id!
      }
    }).then((res) => res.json()))
  };
};

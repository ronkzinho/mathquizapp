import { env } from '$env/dynamic/public';
import { error, type Load } from '@sveltejs/kit';

export const ssr = true;
export const load: Load = async ({ params }) => {
  return {
    ...(await fetch(env.PUBLIC_WORKER_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        id: params.id!,
        'max-age': '' + 60 * 60 * 24
      }
    })
      .then((res) => res.json())
      .catch((err) => {
        throw error(500, 'Invalid id!');
      }))
  };
};

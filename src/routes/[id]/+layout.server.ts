import redis from '@lib/redis';
import { questionSchema } from '@lib/schema/index';
import { error, type Load } from '@sveltejs/kit';
import { ZodError } from 'zod/v4';

export const ssr = true;
export const load: Load = async ({ params }) => {
  const id = params.id;
  if (!id) {
    error(400, '/');
  }

  const details = await redis.get(id);

  if (!details) {
    error(404, 'Quiz not found!');
  }

  try {
    return questionSchema.parse(details);
  } catch (err) {
    error(400, err instanceof ZodError ? err.message : 'Invalid question id!');
  }
};

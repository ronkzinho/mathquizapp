import redis from '@lib/redis';
import { questionSchema } from '@lib/schema';
import { error, type Load } from '@sveltejs/kit';
import { ZodError } from 'zod/v4';

export const ssr = true;

export const load: Load = async ({ params }) => {
    const id = params.id;

    if (!id) {
        error(400, '/');
    }

    const detailsRaw = await redis.get(`quiz:${id}`);

    if (!detailsRaw) {
        error(404, 'Quiz not found!');
    }

    try {
        return questionSchema.parse(detailsRaw);
    } catch (err) {
        console.log(err);
        error(
            400,
            err instanceof ZodError ? err.message : 'Invalid quiz data!'
        );
    }
};

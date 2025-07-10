import redis from '@lib/redis';
import { questionSchema, type Question } from '@lib/schema';
import { error, redirect, type Load } from '@sveltejs/kit';
import crypto from 'crypto';

export const ssr = true;

export const load: Load = async ({ url }) => {
    const seed = url.searchParams.get('seed');
    const time = parseInt(url.searchParams.get('time') || '');
    const quizStarted = url.searchParams.get('quizStarted');
    const eachQuestionTime = decodeURIComponent(
        url.searchParams.get('eachQuestionTime') || ''
    ).split(',');

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
    if (setSeed !== null) quizData.setSeed = setSeed === 'true';

    if (!seed || !time || !quizStarted || !eachQuestionTime) return;

    let id: string | null = null;

    try {
        const details = questionSchema.parse(quizData);

        // Create digest
        const digest = crypto
            .createHash('sha256')
            .update(JSON.stringify(details))
            .digest('hex');

        // Try to claim this digest

        id = await redis.get(`quiz:digest:${digest}`);

        if (id) return;

        // New quiz → assign new ID
        const newId = (await redis.incr('stats')).toString();

        await Promise.all([
            redis.set(`quiz:${newId}`, JSON.stringify(details)),
            redis.set(`quiz:digest:${digest}`, newId)
        ]);
        id = newId;
    } catch (err) {
        error(400, 'Something went wrong!');
    } finally {
        redirect(301, url.href.split('?')[0] + id);
    }
};

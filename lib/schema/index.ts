import { z } from 'zod';

export const questionSchema = z.object({
  seed: z.string(),
  time: z.number(),
  quizStarted: z.string(),
  eachQuestionTime: z.array(z.string()).length(10)
});

export type Question = z.infer<typeof questionSchema>;
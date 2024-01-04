import { getTextService } from './api.js';

export async function runSummaryAction(payload: { input: string }) {
  const { input } = payload;
  const completion = await getTextService().generateText([
    {
      role: 'system',
      content: 'You are a professional writing assisting.',
    },
    { role: 'user', content: input },
    {
      role: 'user',
      content: 'Summarize this text. To make sure do your best.',
    },
  ]);

  return completion;
}

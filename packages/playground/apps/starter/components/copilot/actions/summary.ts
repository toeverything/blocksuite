import { askGPT3_5turbo } from '../api';

export async function runSummaryAction(payload: { input: string }) {
  const { input } = payload;
  const completion = await askGPT3_5turbo([
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

  return completion.content;
}

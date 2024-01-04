import { getTextService, userText } from './api.js';

export async function runSummaryAction(payload: { input: string }) {
  const { input } = payload;
  const completion = await getTextService().generateText([
    {
      role: 'system',
      content: 'You are a professional writing assisting.',
    },
    userText(input),
    userText('Summarize this text. To make sure do your best.'),
  ]);

  return completion;
}

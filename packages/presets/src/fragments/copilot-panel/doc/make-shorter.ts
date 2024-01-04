import { getTextService } from './api.js';

export async function runMakeShorterAction(payload: { input: string }) {
  const { input } = payload;
  const completion = await getTextService().generateText([
    {
      role: 'system',
      content: 'You are a professional writing assisting',
    },
    { role: 'user', content: input },
    {
      role: 'user',
      content:
        'Make the input text shorter, preserving the markdown formatting, like bold, italic, link, highlight. To make sure do your best',
    },
  ]);

  return completion;
}

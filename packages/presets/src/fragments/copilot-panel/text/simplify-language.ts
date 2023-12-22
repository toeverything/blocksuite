import { askGPT3_5turbo } from '../utils/request.js';

export async function runSimplifyWritingAction(payload: { input: string }) {
  const { input } = payload;
  const completion = await askGPT3_5turbo([
    {
      role: 'system',
      content: 'You are a professional writing assisting',
    },
    { role: 'user', content: input },
    {
      role: 'user',
      content:
        'Simplify the text, preserving the markdown formatting if needed, like bold, italic, link, highlight. To make sure do your best',
    },
  ]);

  return completion.content;
}

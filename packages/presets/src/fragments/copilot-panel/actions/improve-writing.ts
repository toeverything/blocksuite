import { askGPT3_5turbo } from '../utils/request.js';

export async function runImproveWritingAction(payload: { input: string }) {
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
        'Improve the writing of the text, preserving the markdown formatting if needed, like bold, italic, link, highlight. To make sure do your best',
    },
  ]);
  return completion.content;
}

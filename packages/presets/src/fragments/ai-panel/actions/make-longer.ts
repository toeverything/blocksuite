import { askGPT3_5turbo } from '../utils/request.js';

export async function runMakeLongerAction(payload: { input: string }) {
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
        'Make the input text longer, preserving the markdown formatting, like bold, italic, link, highlight. To make sure do your best',
    },
  ]);
  return completion.content;
}

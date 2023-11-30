import { askGPT3_5turbo } from '../api';

export async function runFixSpellingAction(payload: { input: string }) {
  const { input } = payload;
  const result = await askGPT3_5turbo([
    {
      role: 'system',
      content: 'You are a professional writing assisting',
    },
    { role: 'user', content: input },
    {
      role: 'user',
      content:
        'Fix the spelling and grammar of the text, preserving the markdown formatting, like bold, italic, link, highlight. To make sure do your best',
    },
  ]);
  return result;
}

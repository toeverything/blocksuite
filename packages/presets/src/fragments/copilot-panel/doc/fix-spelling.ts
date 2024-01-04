import { getTextService, userText } from './api.js';

export async function runFixSpellingAction(payload: { input: string }) {
  const { input } = payload;
  const result = await getTextService().generateText([
    {
      role: 'system',
      content: 'You are a professional writing assisting',
    },
    userText(input),
    userText(
      'Fix the spelling and grammar of the text, preserving the markdown formatting, like bold, italic, link, highlight. To make sure do your best'
    ),
  ]);
  return result;
}

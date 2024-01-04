import { getTextService, userText } from './api.js';

export async function runMakeLongerAction(payload: { input: string }) {
  const { input } = payload;
  const completion = await getTextService().generateText([
    {
      role: 'system',
      content: 'You are a professional writing assisting',
    },
    userText(input),
    userText(
      'Make the input text longer, preserving the markdown formatting, like bold, italic, link, highlight. To make sure do your best'
    ),
  ]);
  return completion;
}

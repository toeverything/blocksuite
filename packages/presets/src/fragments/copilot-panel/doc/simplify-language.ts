import { getChatService, userText } from './api.js';

export async function runSimplifyWritingAction(payload: { input: string }) {
  const { input } = payload;
  const completion = await getChatService().chat([
    {
      role: 'system',
      content: 'You are a professional writing assisting',
    },
    userText(input),
    userText(
      'Simplify the text, preserving the markdown formatting if needed, like bold, italic, link, highlight. To make sure do your best'
    ),
  ]);

  return completion;
}

import { getTextService } from './api.js';

export async function runImproveWritingAction(payload: { input: string }) {
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
        'Improve the writing of the text, preserving the markdown formatting if needed, like bold, italic, link, highlight. To make sure do your best',
    },
  ]);
  return completion;
}

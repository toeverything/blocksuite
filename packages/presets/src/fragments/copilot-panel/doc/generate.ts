import { getTextService, userText } from './api.js';

export async function runGenerateAction(payload: { input: string }) {
  const { input } = payload;
  const result = await getTextService().generateText([
    {
      role: 'system',
      content:
        'You are assisting the user in extending the content of the whiteboard.',
    },
    userText(input),
    userText('Generate more content based on the current input.'),
  ]);
  return result;
}

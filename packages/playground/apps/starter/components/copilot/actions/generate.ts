import { askGPT3_5turbo } from '../api';

export async function runGenerateAction(payload: { input: string }) {
  const { input } = payload;
  const result = await askGPT3_5turbo([
    {
      role: 'system',
      content:
        'You are assisting the user in extending the content of the whiteboard.',
    },
    { role: 'user', content: input },
    {
      role: 'user',
      content: 'Generate more content based on the current input.',
    },
  ]);
  return result.content;
}

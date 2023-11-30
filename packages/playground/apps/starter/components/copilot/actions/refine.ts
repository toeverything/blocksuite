import { askGPT3_5turbo } from '../api';

export async function runRefineAction(payload: { input: string }) {
  const { input } = payload;
  const completion = await askGPT3_5turbo([
    {
      role: 'system',
      content:
        'You are assisting the user in refining the content of the whiteboard.',
    },
    { role: 'user', content: input },
    { role: 'user', content: 'Refine this text.' },
  ]);

  return completion.content;
}

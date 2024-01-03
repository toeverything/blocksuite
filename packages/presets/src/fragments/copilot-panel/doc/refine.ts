import { getTextService } from './api.js';

export async function runRefineAction(payload: { input: string }) {
  const { input } = payload;
  const completion = await getTextService().generateText([
    {
      role: 'system',
      content:
        'You are assisting the user in refining the content of the whiteboard.',
    },
    { role: 'user', content: input },
    { role: 'user', content: 'Refine this text.' },
  ]);

  return completion;
}

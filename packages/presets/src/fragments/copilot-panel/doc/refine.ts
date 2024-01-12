import { getChatService, userText } from './api.js';

export async function runRefineAction(payload: { input: string }) {
  const { input } = payload;
  const completion = await getChatService().chat([
    {
      role: 'system',
      content:
        'You are assisting the user in refining the content of the whiteboard.',
    },
    userText(input),
    userText('Refine this text.'),
  ]);

  return completion;
}

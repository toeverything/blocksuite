import { getTextService } from './api.js';

export async function runAnswerAction({
  question,
  input,
}: {
  input: string;
  question: string;
}) {
  const result = await getTextService().generateText([
    {
      role: 'system',
      content:
        'You are assisting the user in discussing the content of the whiteboard.',
    },
    { role: 'user', content: input },
    { role: 'user', content: question },
  ]);
  return result;
}

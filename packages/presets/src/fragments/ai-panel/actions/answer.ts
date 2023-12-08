import { askGPT3_5turbo } from '../utils/request.js';

export async function runAnswerAction({
  question,
  input,
}: {
  input: string;
  question: string;
}) {
  const result = await askGPT3_5turbo([
    {
      role: 'system',
      content:
        'You are assisting the user in discussing the content of the whiteboard.',
    },
    { role: 'user', content: input },
    { role: 'user', content: question },
  ]);
  return result.content;
}

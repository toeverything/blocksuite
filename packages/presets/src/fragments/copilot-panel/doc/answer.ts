import { getTextService, userText } from './api.js';

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
    userText(input),
    userText(question),
  ]);
  return result;
}

import { getChatService, userText } from './api.js';

export async function runChangeToneAction({
  input,
  tone,
}: {
  input: string;
  tone: string;
}) {
  const result = await getChatService().chat([
    {
      role: 'system',
      content: 'You are assisting the user in writing high quality content.',
    },
    userText(input),
    userText(
      `Change the tone the of Markdown text to ${tone}, preserving the formatting, like bold, italic, link, highlight. Please be sure to only return the content.`
    ),
  ]);
  return result;
}

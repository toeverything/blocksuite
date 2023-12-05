import { askGPT3_5turbo } from '../utils/request.js';

export async function runTranslateAction(payload: {
  input: string;
  language: string;
}) {
  const { input, language } = payload;
  const completion = await askGPT3_5turbo([
    {
      role: 'system',
      content: 'You are assisting the user in translating the content.',
    },
    { role: 'user', content: input },
    {
      role: 'user',
      content: `Translate the Markdown text to ${language} while preserving the formatting, like bold, italic, link, highlight. Please only return the result of translate.`,
    },
  ]);

  return completion.content;
}

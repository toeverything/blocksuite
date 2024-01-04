import { getTextService, userText } from './api.js';

export async function runTranslateAction(payload: {
  input: string;
  language: string;
}) {
  const { input, language } = payload;
  const completion = await getTextService().generateText([
    {
      role: 'system',
      content: 'You are assisting the user in translating the content.',
    },
    userText(input),
    userText(
      `Translate the Markdown text to ${language} while preserving the formatting, like bold, italic, link, highlight. Please only return the result of translate.`
    ),
  ]);

  return completion;
}

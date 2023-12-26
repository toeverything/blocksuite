import { copilotConfig } from '../copilot-service/copilot-config.js';
import { TextServiceKind } from '../copilot-service/service-base.js';

export async function runTranslateAction(payload: {
  input: string;
  language: string;
}) {
  const { input, language } = payload;
  const completion = await copilotConfig
    .getService(TextServiceKind)
    .generateText([
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

  return completion;
}

import { copilotConfig } from '../copilot-service/copilot-config.js';
import { TextServiceKind } from '../copilot-service/service-base.js';

export async function runFixSpellingAction(payload: { input: string }) {
  const { input } = payload;
  const result = await copilotConfig.getService(TextServiceKind).generateText([
    {
      role: 'system',
      content: 'You are a professional writing assisting',
    },
    { role: 'user', content: input },
    {
      role: 'user',
      content:
        'Fix the spelling and grammar of the text, preserving the markdown formatting, like bold, italic, link, highlight. To make sure do your best',
    },
  ]);
  return result;
}

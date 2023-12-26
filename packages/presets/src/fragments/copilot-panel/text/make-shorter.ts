import { copilotConfig } from '../copilot-service/copilot-config.js';
import { TextServiceKind } from '../copilot-service/service-base.js';

export async function runMakeShorterAction(payload: { input: string }) {
  const { input } = payload;
  const completion = await copilotConfig
    .getService(TextServiceKind)
    .generateText([
      {
        role: 'system',
        content: 'You are a professional writing assisting',
      },
      { role: 'user', content: input },
      {
        role: 'user',
        content:
          'Make the input text shorter, preserving the markdown formatting, like bold, italic, link, highlight. To make sure do your best',
      },
    ]);

  return completion;
}

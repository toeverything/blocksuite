import { copilotConfig } from '../copilot-service/copilot-config.js';
import { TextServiceKind } from '../copilot-service/service-base.js';

export async function runImproveWritingAction(payload: { input: string }) {
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
          'Improve the writing of the text, preserving the markdown formatting if needed, like bold, italic, link, highlight. To make sure do your best',
      },
    ]);
  return completion;
}

import { copilotConfig } from '../copilot-service/copilot-config.js';
import { TextServiceKind } from '../copilot-service/service-base.js';

export async function runSummaryAction(payload: { input: string }) {
  const { input } = payload;
  const completion = await copilotConfig
    .getService(TextServiceKind)
    .generateText([
      {
        role: 'system',
        content: 'You are a professional writing assisting.',
      },
      { role: 'user', content: input },
      {
        role: 'user',
        content: 'Summarize this text. To make sure do your best.',
      },
    ]);

  return completion;
}

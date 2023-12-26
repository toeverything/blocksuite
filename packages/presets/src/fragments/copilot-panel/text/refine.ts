import { copilotConfig } from '../copilot-service/copilot-config.js';
import { TextServiceKind } from '../copilot-service/service-base.js';

export async function runRefineAction(payload: { input: string }) {
  const { input } = payload;
  const completion = await copilotConfig
    .getService(TextServiceKind)
    .generateText([
      {
        role: 'system',
        content:
          'You are assisting the user in refining the content of the whiteboard.',
      },
      { role: 'user', content: input },
      { role: 'user', content: 'Refine this text.' },
    ]);

  return completion;
}

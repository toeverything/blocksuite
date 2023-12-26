import { copilotConfig } from '../copilot-service/copilot-config.js';
import { TextServiceKind } from '../copilot-service/service-base.js';

export async function runGenerateAction(payload: { input: string }) {
  const { input } = payload;
  const result = await copilotConfig.getService(TextServiceKind).generateText([
    {
      role: 'system',
      content:
        'You are assisting the user in extending the content of the whiteboard.',
    },
    { role: 'user', content: input },
    {
      role: 'user',
      content: 'Generate more content based on the current input.',
    },
  ]);
  return result;
}

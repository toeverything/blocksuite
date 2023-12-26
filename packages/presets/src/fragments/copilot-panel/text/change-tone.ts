import { copilotConfig } from '../copilot-service/copilot-config.js';
import { TextServiceKind } from '../copilot-service/service-base.js';

export async function runChangeToneAction({
  input,
  tone,
}: {
  input: string;
  tone: string;
}) {
  const result = await copilotConfig.getService(TextServiceKind).generateText([
    {
      role: 'system',
      content: 'You are assisting the user in writing high quality content.',
    },
    { role: 'user', content: input },
    {
      role: 'user',
      content: `Change the tone the of Markdown text to ${tone}, preserving the formatting, like bold, italic, link, highlight. Please be sure to only return the content.`,
    },
  ]);
  return result;
}

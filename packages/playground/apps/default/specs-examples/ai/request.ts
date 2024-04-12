import { CopilotClient, toTextStream } from '@blocksuite/presets';

const TIMEOUT = 5000;

const backendUrl = 'http://localhost:3010';

export function textToTextStream({
  docId,
  workspaceId,
  prompt,
  attachments,
  params,
}: {
  docId: string;
  workspaceId: string;
  prompt: string;
  attachments?: string[];
  params?: Record<string, string>;
}): BlockSuitePresets.TextStream {
  const client = new CopilotClient(backendUrl);
  return {
    [Symbol.asyncIterator]: async function* () {
      const hasAttachments = attachments && attachments.length > 0;
      const session = await client.createSession({
        workspaceId,
        docId,
        promptName: hasAttachments ? 'debug:action:vision4' : 'Summary',
      });
      if (hasAttachments) {
        const messageId = await client.createMessage({
          sessionId: session,
          content: prompt,
          attachments,
          params,
        });
        const eventSource = client.textStream(messageId, session);
        yield* toTextStream(eventSource, { timeout: TIMEOUT });
      } else {
        const eventSource = client.textToTextStream(prompt, session);
        yield* toTextStream(eventSource, { timeout: TIMEOUT });
      }
    },
  };
}

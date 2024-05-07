import { CopilotClient } from './copilot-client';
import { toTextStream } from './event-source';

const TIMEOUT = 5000;

const backendUrl = 'http://localhost:3010';

function readBlobAsURL(blob: Blob | File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      if (typeof e.target?.result === 'string') {
        resolve(e.target.result);
      } else {
        reject();
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

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
  attachments?: (Blob | File | string)[];
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
          attachments: await Promise.all(
            attachments.map(a => (typeof a === 'string' ? a : readBlobAsURL(a)))
          ),
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

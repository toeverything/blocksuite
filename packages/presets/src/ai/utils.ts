import {
  type AffineAIPanelWidget,
  type AffineAIPanelWidgetConfig,
} from '@blocksuite/blocks';

import type { CopilotClient } from './copilot-client.js';

export function getGenerateAnswer({
  copilotClient,
  panel,
}: {
  copilotClient: CopilotClient;
  panel: AffineAIPanelWidget;
}) {
  const generateAnswer: AffineAIPanelWidgetConfig['generateAnswer'] = ({
    input,
    update,
    finish,
    signal,
  }) => {
    copilotClient
      .createSession({
        workspaceId: panel.host.doc.collection.id,
        docId: panel.host.doc.id,
        model: 'Gpt4TurboPreview',
        promptName: 'placeholder',
      })
      .then(sessionId => {
        const stream = copilotClient.textToTextStream(input, sessionId);
        let timeout: ReturnType<typeof setTimeout> | null = null;
        stream.addEventListener('message', e => {
          if (timeout) clearTimeout(timeout);
          update((panel.answer ?? '') + e.data);

          // Terminate after 5 seconds of inactivity
          timeout = setTimeout(() => {
            finish('error');
            stream.close();
          }, 5000);
        });
        stream.addEventListener('error', () => {
          if (timeout) clearTimeout(timeout);
          finish('success');
        });
        signal.addEventListener('abort', () => {
          stream.close();
          finish('aborted');
        });
      })
      .catch(console.error);
  };
  return generateAnswer;
}

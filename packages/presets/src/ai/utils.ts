import type { EditorHost } from '@blocksuite/block-std';
import {
  type AffineAIPanelWidget,
  type AffineAIPanelWidgetConfig,
  defaultImageProxyMiddleware,
  MarkdownAdapter,
} from '@blocksuite/blocks';
import type { Doc } from '@blocksuite/store';
import { DocCollection, Job } from '@blocksuite/store';

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

export async function markDownToDoc(host: EditorHost, answer: string) {
  const schema = host.std.doc.collection.schema;
  // Should not create a new doc in the original collection
  const collection = new DocCollection({ schema });
  const job = new Job({
    collection,
    middlewares: [defaultImageProxyMiddleware],
  });
  const mdAdapter = new MarkdownAdapter();
  mdAdapter.applyConfigs(job.adapterConfigs);
  const snapshot = await mdAdapter.toDocSnapshot({
    file: answer,
    assets: job.assetsManager,
  });
  const doc = await job.snapshotToDoc(snapshot);
  if (!doc) throw new Error('Failed to convert markdown to doc');
  return doc as Doc;
}

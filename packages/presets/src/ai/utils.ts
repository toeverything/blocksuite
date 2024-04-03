import {
  type AffineAIPanelWidget,
  type AffineAIPanelWidgetConfig,
  defaultImageProxyMiddleware,
  InsertBelowIcon,
  MarkdownAdapter,
} from '@blocksuite/blocks';
import { Job } from '@blocksuite/store';

import type { CopilotClient } from './copilot-client.js';
import { textRenderer } from './messages/text.js';

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
        action: true,
        model: 'Gpt4TurboPreview',
        promptName: '',
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
        });
      })
      .catch(console.error);
  };
  return generateAnswer;
}

export async function insertBelow(panel: AffineAIPanelWidget) {
  const host = panel.host;
  const selection = host.selection.find('text');
  if (!selection || !selection.isCollapsed() || selection.from.index !== 0) {
    return;
  }

  const block = host.view.viewFromPath('block', selection.path);
  if (!block) return;
  const blockParent = host.view.viewFromPath('block', block.parentPath);
  if (!blockParent) return;
  const blockIndex = blockParent.model.children.findIndex(
    x => x.id === block.model.id
  );

  const doc = host.doc;
  const job = new Job({
    collection: doc.collection,
    middlewares: [defaultImageProxyMiddleware],
  });
  const adapter = new MarkdownAdapter();
  adapter.applyConfigs(job.adapterConfigs);

  const snapshot = await adapter.toSliceSnapshot({
    file: panel.answer ?? '',
    assets: job.assetsManager,
    pageVersion: doc.collection.meta.pageVersion!,
    workspaceVersion: doc.collection.meta.workspaceVersion!,
    workspaceId: doc.collection.id,
    pageId: doc.id,
  });
  if (!snapshot) return;

  doc.deleteBlock(block.model, {
    bringChildrenTo: blockParent.model,
  });

  const blockSnapshots = snapshot.content.flatMap(x => x.children);
  for (const [index, snapshot] of blockSnapshots.entries()) {
    await job.snapshotToBlock(
      snapshot,
      doc,
      blockParent.model.id,
      blockIndex + index
    );
  }

  panel.hide();
}

export function createDefaultPanelConfig(
  panel: AffineAIPanelWidget,
  copilotClient: CopilotClient
) {
  return {
    answerRenderer: textRenderer,
    generateAnswer: getGenerateAnswer({
      copilotClient,
      panel,
    }),

    finishStateConfig: {
      responses: [
        {
          name: 'Insert',
          icon: InsertBelowIcon,
          handler: () => {
            insertBelow(panel).catch(console.error);
          },
        },
      ],
      actions: [],
    },
    errorStateConfig: {
      upgrade: () => {},
      responses: [],
    },
  };
}

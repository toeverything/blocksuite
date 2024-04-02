import {
  type AffineAIPanelWidget,
  defaultImageProxyMiddleware,
  InsertBelowIcon,
  MarkdownAdapter,
} from '@blocksuite/blocks';
import { Job } from '@blocksuite/store';

import { CopilotClient } from '../../copilot-client.js';
import { textRenderer } from '../../message/text.js';
import { getGenerateAnswer } from '../../utils.js';

export function setupSpaceEntry(panel: AffineAIPanelWidget) {
  const host = panel.host;
  const copilotClient = new CopilotClient('http://localhost:3010');

  panel.handleEvent('keyDown', ctx => {
    const keyboardState = ctx.get('keyboardState');
    if (keyboardState.raw.key === ' ') {
      const selection = host.selection.find('text');
      if (selection && selection.isCollapsed() && selection.from.index === 0) {
        const block = host.view.viewFromPath('block', selection.path);
        if (!block?.model?.text || block.model.text?.length > 0) return;

        keyboardState.raw.preventDefault();

        const insertBelow = async (panel: AffineAIPanelWidget) => {
          const doc = host.doc;
          const block = host.view.viewFromPath('block', selection.path);
          if (!block) return;
          const blockParent = host.view.viewFromPath('block', block.parentPath);
          if (!blockParent) return;
          const blockIndex = blockParent.model.children.findIndex(
            x => x.id === block.model.id
          );

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
        };

        panel.config = {
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
        panel.toggle(block);
      }
    }
  });
}

import type { EditorHost } from '@blocksuite/block-std';
import type { AffineAIPanelWidget } from '@blocksuite/blocks';
import {
  defaultImageProxyMiddleware,
  MarkdownAdapter,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import { Job } from '@blocksuite/store';

export function getInsertBelowHandler(host: EditorHost) {
  const selection = host.selection.find('text');
  assertExists(selection);
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

  return insertBelow;
}

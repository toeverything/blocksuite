import { assertExists, diffArray } from '@blocksuite/global/utils';

import type { Workspace } from '../workspace.js';
import type { BacklinkIndexer, IndexUpdatedEvent } from './backlink.js';

/**
 * If the page has been added, updated or removed,
 * update the subpageIds in the pageMeta
 *
 * You need to ensure that all operations on pageMeta are **idempotent**.
 */
export function normalizeSubpage(
  { action, pageId, blockId }: IndexUpdatedEvent,
  workspace: Workspace,
  backlinkIndexer: BacklinkIndexer
) {
  const pageMetas = workspace.meta.pageMetas;
  const page = workspace.getPage(pageId);
  if (action === 'delete') {
    if (!blockId) {
      // delete page
      if (page) {
        console.warn(
          `Received delete page event, but page ${pageId} found`,
          page
        );
        return;
      }
      // removed subpageId from the parent page when remove page
      const parentMetas = pageMetas.filter(({ subpageIds }) =>
        subpageIds.includes(pageId)
      );
      // This is a redundant check.
      // In a normal scenario, this part of the code should not be executed.
      if (parentMetas.length) {
        // In most case, we already remove the subpage node before delete page
        console.warn('Unexpected subpageId in parent page', parentMetas);
      }
      parentMetas.forEach(meta => {
        workspace.meta.setPageMeta(meta.id, {
          subpageIds: meta.subpageIds.filter(id => id !== pageId),
        });
      });
      return;
    }
    // delete block
  }
  // add block or update block
  if (!page) {
    console.error(`Unable to normalize doc! Page ${pageId} not found`);
    return;
  }
  const curPageMeta = pageMetas.find(meta => meta.id === pageId);
  assertExists(curPageMeta);
  const curSubpageIds = curPageMeta.subpageIds;
  const subpageNodes = backlinkIndexer.getSubpageNodes(pageId);
  // check change
  const diff = diffArray(
    curSubpageIds,
    subpageNodes.map(node => node.pageId)
  );
  if (!diff.changed) return;
  workspace.meta.setPageMeta(pageId, {
    subpageIds: subpageNodes.map(node => node.pageId),
  });
}

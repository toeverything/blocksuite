import { assertExists, diffArray } from '@blocksuite/global/utils';

import type { Workspace } from '../workspace.js';
import type { BacklinkIndexer, IndexUpdatedEvent } from './backlink.js';

/**
 * Check if the page has been deleted,
 * then remove the pageId from the subpageIds
 */
export function reviseSubpage(
  { action, pageId, blockId }: IndexUpdatedEvent,
  workspace: Workspace,
  backlinkIndexer: BacklinkIndexer
) {
  if (action === 'delete') {
    if (!blockId) {
      // delete page
      // removed subpageId from the parent page when remove page
      const pageMetas = workspace.meta.pageMetas;
      pageMetas
        .filter(({ subpageIds }) => subpageIds.includes(pageId))
        .forEach(meta => {
          console.warn('Unexpected subpageId in parent page', meta);
          workspace.setPageMeta(meta.id, {
            subpageIds: meta.subpageIds.filter(id => id !== pageId),
          });
        });
      return;
    }
    // delete block
  }
  const page = workspace.getPage(pageId);
  if (!page) {
    console.warn('Failed to revise doc! Page not found', pageId);
    return;
  }
  const pageMetas = workspace.meta.pageMetas;
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

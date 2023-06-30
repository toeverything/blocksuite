import type { Disposable } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';

import type { BackLink } from './backlink-popover.js';

export const listenBacklinkList = (
  page: Page,
  cb: (list: BackLink[]) => void
): Disposable => {
  const backlinkIndexer = page.workspace.indexer.backlink;
  cb(backlinkIndexer.getBacklink(page.id));
  return backlinkIndexer.slots.indexUpdated.on(() => {
    cb(backlinkIndexer.getBacklink(page.id));
  });
};

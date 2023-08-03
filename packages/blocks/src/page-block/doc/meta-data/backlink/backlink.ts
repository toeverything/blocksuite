import { LinkedPageIcon, PageIcon } from '@blocksuite/global/config';
import type { Disposable } from '@blocksuite/global/utils';
import type { PageMeta } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

import type { BlockHost } from '../../../../__internal__/index.js';
import type { AffineTextAttributes } from '../../../../__internal__/rich-text/virgo/types.js';

export type BackLink = {
  pageId: string;
  blockId: string;
  type: NonNullable<AffineTextAttributes['reference']>['type'];
};

export const listenBacklinkList = (
  host: BlockHost,
  cb: (list: BacklinkData[]) => void
): Disposable => {
  const metaMap = Object.fromEntries(
    host.page.workspace.meta.pageMetas.map(v => [v.id, v])
  );
  const page = host.page;
  const toData = (backlink: BackLink): BacklinkData => {
    const pageMeta = metaMap[backlink.pageId];
    if (!pageMeta) {
      console.warn('Unexpected page meta not found', backlink.pageId);
    }
    return {
      ...backlink,
      ...pageMeta,
      icon: backlink.type === 'LinkedPage' ? LinkedPageIcon : PageIcon,
      jump: () => {
        if (backlink.pageId === page.id) {
          // On the current page, no need to jump
          // TODO jump to block
          return;
        }
        host.slots.pageLinkClicked.emit({
          pageId: backlink.pageId,
          blockId: backlink.blockId,
        });
      },
    };
  };
  const backlinkIndexer = page.workspace.indexer.backlink;
  const getList = () => {
    return backlinkIndexer
      .getBacklink(page.id)
      .filter(v => v.type === 'LinkedPage')
      .map(toData);
  };
  cb(getList());
  return backlinkIndexer.slots.indexUpdated.on(() => {
    cb(getList());
  });
};
export type BacklinkData = BackLink &
  PageMeta & {
    jump: () => void;
    icon: TemplateResult;
  };
export const DEFAULT_PAGE_NAME = 'Untitled';

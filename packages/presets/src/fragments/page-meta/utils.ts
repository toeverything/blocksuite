import type { AffineTextAttributes } from '@blocksuite/blocks';
import {
  getPageByEditorHost,
  LinkedPageIcon,
  PageIcon,
} from '@blocksuite/blocks';
import { assertExists, type Disposable } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import type { Page, PageMeta } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

export const DEFAULT_PAGE_NAME = 'Untitled';

export type BackLink = {
  pageId: string;
  blockId: string;
  type: NonNullable<AffineTextAttributes['reference']>['type'];
};

export type BacklinkData = BackLink &
  PageMeta & {
    jump: () => void;
    icon: TemplateResult;
  };

export function listenBacklinkList(
  page: Page,
  editorHost: EditorHost,
  cb: (list: BacklinkData[]) => void
): Disposable {
  const metaMap = Object.fromEntries(
    page.workspace.meta.pageMetas.map(v => [v.id, v])
  );

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
        if (backlink.pageId === page.id) return;

        const pageElement = getPageByEditorHost(editorHost);
        assertExists(pageElement);
        pageElement.slots.pageLinkClicked.emit({
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
}

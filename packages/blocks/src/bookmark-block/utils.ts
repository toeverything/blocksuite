import type { BaseBlockModel } from '@blocksuite/store';

import type { BookmarkBlockModel, BookmarkProps } from './bookmark-model.js';

export const refreshBookmarkBlock = (
  model: BaseBlockModel<BookmarkBlockModel>
) => {
  // @ts-ignore
  if (window?.apis?.ui?.getBookmarkDataByLink) {
    // This method is get website's metaData by link
    // And only exists in the AFFiNE client
    // @ts-ignore
    window.apis.ui
      .getBookmarkDataByLink(model.url)
      .then((data: BookmarkProps) => {
        model.page.updateBlock(model, {
          ...data,
          url: model.url,
        });
      });
  }
};

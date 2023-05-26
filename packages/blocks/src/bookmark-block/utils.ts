import type { BaseBlockModel } from '@blocksuite/store';

import type { BookmarkBlockModel, BookmarkProps } from './bookmark-model.js';

// Result is boolean used to record whether the meta data is crawled
export const refreshBookmarkBlock = async (
  model: BaseBlockModel<BookmarkBlockModel>,
  force = false
) => {
  // @ts-ignore
  if (window?.apis?.ui?.getBookmarkDataByLink) {
    if (model.hasCrawled && !force) {
      return;
    }
    // This method is get website's metaData by link
    // And only exists in the AFFiNE client
    // @ts-ignore
    const metaData = (await window.apis.ui.getBookmarkDataByLink(
      model.url
    )) as BookmarkProps;

    model.page.updateBlock(model, {
      ...metaData,
      url: model.url,
      hasCrawled: true,
    });
  }
};

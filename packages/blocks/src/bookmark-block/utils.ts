import type { BaseBlockModel } from '@blocksuite/store';

import type { BookmarkBlockComponent } from './bookmark-block.js';
import type { BookmarkBlockModel, BookmarkProps } from './bookmark-model.js';
import { defaultBookmarkProps } from './bookmark-model.js';
// Result is boolean used to record whether the meta data is crawled
export const reloadBookmarkBlock = async (
  model: BaseBlockModel<BookmarkBlockModel>,
  bookmarkElement: BookmarkBlockComponent,
  force = false
) => {
  // @ts-ignore
  if (window?.apis?.ui?.getBookmarkDataByLink) {
    if ((model.hasCrawled || !model.url) && !force) {
      return;
    }

    bookmarkElement.loading = true;
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

    bookmarkElement.loading = false;
  }
};

export const cloneBookmarkProperties = (
  model: BaseBlockModel<BookmarkBlockModel>
) => {
  return Object.keys(defaultBookmarkProps).reduce<BookmarkProps>(
    (props, key) => {
      props[key] = model[key];
      return props;
    },
    {} as BookmarkProps
  );
};

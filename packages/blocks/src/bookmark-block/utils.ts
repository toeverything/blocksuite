import { assertExists } from '@blocksuite/global/utils';

import type { BookmarkBlockComponent } from './bookmark-block.js';

// Result is boolean used to record whether the meta data is crawled
export async function refreshBookmarkUrlData(
  bookmarkElement: BookmarkBlockComponent
) {
  let title = null,
    description = null,
    icon = null,
    image = null;

  try {
    bookmarkElement.loading = true;

    const queryUrlData = bookmarkElement.service?.queryUrlData;
    assertExists(queryUrlData);

    const bookmarkUrlData = await queryUrlData(bookmarkElement.model.url);
    ({
      title = null,
      description = null,
      icon = null,
      image = null,
    } = bookmarkUrlData);

    if (!title && !description && !icon && !image) {
      bookmarkElement.loadingFailed = true;
    }
  } catch (error) {
    console.error(error);
    bookmarkElement.loadingFailed = true;
  } finally {
    bookmarkElement.page.updateBlock(bookmarkElement.model, {
      title,
      description,
      icon,
      image,
    });

    bookmarkElement.loading = false;
  }
}

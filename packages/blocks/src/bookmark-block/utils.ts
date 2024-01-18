import { assertExists } from '@blocksuite/global/utils';

import type { BookmarkBlockComponent } from './bookmark-block.js';

// Result is boolean used to record whether the meta data is crawled
export async function refreshBookmarkUrlData(
  bookmarkElement: BookmarkBlockComponent
) {
  bookmarkElement.loading = true;

  const queryUrlData = bookmarkElement.service?.queryUrlData;
  assertExists(queryUrlData);

  let title, description, icon, image;

  try {
    const metaData = await queryUrlData(bookmarkElement.model.url);
    title = metaData.title ?? null;
    description = metaData.description ?? null;
    icon = metaData.icon ?? null;
    image = metaData.image ?? null;
    if (!title && !description && !icon && !image) {
      bookmarkElement.loadingFailed = true;
    }
  } catch (error) {
    console.error(error);
    bookmarkElement.loadingFailed = true;
  }

  bookmarkElement.page.updateBlock(bookmarkElement.model, {
    title,
    description,
    icon,
    image,
  });
  bookmarkElement.loading = false;
}

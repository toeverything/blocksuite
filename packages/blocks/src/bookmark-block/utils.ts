import { isAbortError } from '@blocksuite/affine-shared/utils';
import { assertExists } from '@blocksuite/global/utils';

import type { BookmarkBlockComponent } from './bookmark-block.js';

export async function refreshBookmarkUrlData(
  bookmarkElement: BookmarkBlockComponent,
  signal?: AbortSignal
) {
  let title = null,
    description = null,
    icon = null,
    image = null;

  try {
    bookmarkElement.loading = true;

    const queryUrlData = bookmarkElement.service?.queryUrlData;
    assertExists(queryUrlData);

    const bookmarkUrlData = await queryUrlData(
      bookmarkElement.model.url,
      signal
    );

    title = bookmarkUrlData.title ?? null;
    description = bookmarkUrlData.description ?? null;
    icon = bookmarkUrlData.icon ?? null;
    image = bookmarkUrlData.image ?? null;

    if (!title && !description && !icon && !image) {
      bookmarkElement.error = true;
    }

    if (signal?.aborted) return;

    bookmarkElement.doc.updateBlock(bookmarkElement.model, {
      title,
      description,
      icon,
      image,
    });
  } catch (error) {
    if (signal?.aborted || isAbortError(error)) return;
    throw error;
  } finally {
    bookmarkElement.loading = false;
  }
}

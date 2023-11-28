import type { BookmarkBlockComponent } from './bookmark-block.js';
import type {
  BookmarkBlockModel,
  BookmarkBlockProps,
} from './bookmark-model.js';

export function tryGetBookmarkAPI():
  | ((url: string) => Promise<BookmarkBlockProps>)
  | null {
  // This method is get website's metaData by link
  // And only exists in the AFFiNE client
  // @ts-expect-error
  if (window?.apis?.ui?.getBookmarkDataByLink) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).apis.ui.getBookmarkDataByLink;
  }
  return null;
}

// Result is boolean used to record whether the meta data is crawled
export async function reloadBookmarkBlock(
  model: BookmarkBlockModel,
  bookmarkElement: BookmarkBlockComponent,
  force = false
) {
  const getBookmarkDataByLink = tryGetBookmarkAPI();
  if (!getBookmarkDataByLink) return;
  if ((model.crawled || !model.url) && !force) {
    return;
  }

  bookmarkElement.loading = true;

  const metaData = await getBookmarkDataByLink(model.url);

  // check is block exist
  if (!model.page.getBlockById(model.id)) {
    return;
  }

  const { title, description, icon, image } = metaData;

  model.page.withoutTransact(() => {
    model.page.updateBlock(model, {
      bookmarkTitle: title,
      description,
      icon,
      image,
      url: model.url,
      crawled: true,
    });
  });

  bookmarkElement.loading = false;
}

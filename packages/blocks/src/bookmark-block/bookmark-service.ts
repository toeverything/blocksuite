import type {
  BlockTransformContext,
  SerializedBlock,
} from '../__internal__/index.js';
import { BaseService } from '../__internal__/service/index.js';
import type { BookmarkBlockModel } from './bookmark-model.js';
import { cloneBookmarkProperties } from './utils.js';

export class BookmarkBlockService extends BaseService<BookmarkBlockModel> {
  override block2html(
    block: BookmarkBlockModel,
    { childText = '', begin, end }: BlockTransformContext = {}
  ) {
    return `<p><a href="${block.url}">${
      block.title ? block.title : 'Bookmark'
    }</a></p>`;
  }
  override block2Text(
    block: BookmarkBlockModel,
    { childText = '', begin = 0, end }: BlockTransformContext = {}
  ): string {
    return block.url;
  }

  override block2Json(
    block: BookmarkBlockModel,
    begin?: number,
    end?: number
  ): SerializedBlock {
    const clonedProps = cloneBookmarkProperties(block);

    return {
      flavour: block.flavour,
      children: [],
      ...clonedProps,
    };
  }
}

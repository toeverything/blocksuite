import type { BlockTransformContext } from '../__internal__/index.js';
import { BaseService } from '../__internal__/service/index.js';
import type { BookmarkBlockModel } from './bookmark-model.js';
export class BookmarkBlockService extends BaseService<BookmarkBlockModel> {
  override block2html(
    block: BookmarkBlockModel,
    { childText = '', begin, end }: BlockTransformContext = {}
  ) {
    return block.url;
  }
}

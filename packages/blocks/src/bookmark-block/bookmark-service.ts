import { BlockService } from '@blocksuite/block-std';

import type { BookmarkBlockModel } from './bookmark-model.js';
import { type QueryUrlData, queryUrlDataFromAffineWorker } from './utils.js';

export class BookmarkService extends BlockService<BookmarkBlockModel> {
  queryUrlData: QueryUrlData = async (url: string) => {
    return queryUrlDataFromAffineWorker(url);
  };
}

import { BlockService } from '@blocksuite/block-std';

import {
  queryLinkPreview,
  setLinkPreviewEndpoint,
} from '../_common/embed-block-helper/index.js';
import type { BookmarkBlockModel } from './bookmark-model.js';

export class BookmarkService extends BlockService<BookmarkBlockModel> {
  queryUrlData = (url: string) => {
    return queryLinkPreview(url);
  };

  static setLinkPreviewEndpoint = setLinkPreviewEndpoint;
}

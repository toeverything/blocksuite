import { BlockService } from '@blocksuite/block-std';

import { LinkPreviewer } from '../_common/embed-block-helper/index.js';
import type { BookmarkBlockModel } from './bookmark-model.js';

export class BookmarkService extends BlockService<BookmarkBlockModel> {
  private static readonly linkPreviewer = new LinkPreviewer();

  queryUrlData = (url: string) => {
    return BookmarkService.linkPreviewer.query(url);
  };

  static setLinkPreviewEndpoint = BookmarkService.linkPreviewer.setEndpoint;
}

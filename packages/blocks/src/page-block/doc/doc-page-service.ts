import { Slot } from '@blocksuite/store';

import type { Viewport } from '../../_common/utils/index.js';
import { PageService } from '../page-service.js';

export class DocPageService extends PageService {
  slots = {
    pageLinkClicked: new Slot<{
      pageId: string;
      blockId?: string;
    }>(),
    tagClicked: new Slot<{
      tagId: string;
    }>(),
    viewportUpdated: new Slot<Viewport>(),
  };
}

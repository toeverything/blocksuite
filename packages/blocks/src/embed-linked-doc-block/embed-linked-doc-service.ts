import { BlockService } from '@blocksuite/block-std';
import { Slot } from '@blocksuite/store';

import type { EmbedLinkedDocModel } from './embed-linked-doc-model.js';

export class EmbedLinkedDocService extends BlockService<EmbedLinkedDocModel> {
  slots = {
    linkedDocCreated: new Slot<{ pageId: string }>(),
  };
}

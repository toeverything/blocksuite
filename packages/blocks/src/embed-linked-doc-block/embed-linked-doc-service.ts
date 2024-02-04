import { BlockService } from '@blocksuite/block-std';
import { Slot } from '@blocksuite/store';

export class EmbedLinkedDocService extends BlockService {
  slots = {
    linkedDocCreated: new Slot<{ pageId: string }>(),
  };
}

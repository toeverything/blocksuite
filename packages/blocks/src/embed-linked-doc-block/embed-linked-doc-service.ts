import { BlockService } from '@blocksuite/block-std';
import { Slot } from '@blocksuite/store';

import { insertLinkByQuickSearchCommand } from './commands/insert-link-by-quick-search.js';
import type { EmbedLinkedDocModel } from './embed-linked-doc-model.js';

export class EmbedLinkedDocBlockService extends BlockService<EmbedLinkedDocModel> {
  slots = {
    linkedDocCreated: new Slot<{ docId: string }>(),
  };

  override mounted() {
    super.mounted();
    this.std.command.add(
      'insertLinkByQuickSearch',
      insertLinkByQuickSearchCommand
    );
  }
}

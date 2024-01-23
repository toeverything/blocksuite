import { BlockService } from '@blocksuite/block-std';

import { selectBlock, selectBlocksBetween } from './commands/index.js';
import type { NoteBlockModel } from './note-model.js';

export class NoteService extends BlockService<NoteBlockModel> {
  override mounted() {
    super.mounted();

    this.std.command
      .add('selectBlocksBetween', selectBlocksBetween)
      .add('selectBlock', selectBlock);
  }
}

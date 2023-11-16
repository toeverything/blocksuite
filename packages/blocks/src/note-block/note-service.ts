import { BlockService } from '@blocksuite/block-std';

import {
  changeTextSelectionSideways,
  changeTextSelectionSidewaysToBlock,
  changeTextSelectionToBlockStartEnd,
  changeTextSelectionVertically,
  moveCursorToBlock,
  moveCursorVertically,
} from './commands/index.js';
import type { NoteBlockModel } from './note-model.js';

export class NoteService extends BlockService<NoteBlockModel> {
  override mounted() {
    super.mounted();

    this.std.command
      .add('moveCursorVertically', moveCursorVertically)
      .add('moveCursorToBlock', moveCursorToBlock)
      .add('changeTextSelectionSideways', changeTextSelectionSideways)
      .add(
        'changeTextSelectionSidewaysToBlock',
        changeTextSelectionSidewaysToBlock
      )
      .add('changeTextSelectionVertically', changeTextSelectionVertically)
      .add(
        'changeTextSelectionToBlockStartEnd',
        changeTextSelectionToBlockStartEnd
      );
  }
}

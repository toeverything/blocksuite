import { BlockService } from '@blocksuite/block-std';

import { copySelectedBlockCommand } from '../commands/copy-selected-block.js';
import { deleteSelectedBlockCommand } from '../commands/delete-selected-block.js';
import { deleteSelectedTextCommand } from '../commands/delete-selected-text.js';
import { formatBlockCommand } from '../commands/format/format-block.js';
import { formatNativeCommand } from '../commands/format/format-native.js';
import { formatTextCommand } from '../commands/format/format-text.js';
import { getBlockIndexCommand } from '../commands/get-block-index.js';
import { getBlockSelectionsCommand } from '../commands/get-block-selection-by-side.js';
import { getNextBlockCommand } from '../commands/get-next-block.js';
import { getPrevBlockCommand } from '../commands/get-prev-block.js';
import { getSelectedModelsCommand } from '../commands/get-selected-models.js';
import { getTextSelectionCommand } from '../commands/get-text-selection.js';
import type { PageBlockModel } from '../page-model.js';

export class EdgelessPageService extends BlockService<PageBlockModel> {
  override mounted() {
    super.mounted();
    this.std.command
      .add('getNextBlock', getNextBlockCommand)
      .add('getPrevBlock', getPrevBlockCommand)
      .add('getSelectedModels', getSelectedModelsCommand)
      .add('getBlockIndex', getBlockIndexCommand)
      .add('deleteSelectedText', deleteSelectedTextCommand)
      .add('deleteSelectedBlock', deleteSelectedBlockCommand)
      .add('copySelectedBlock', copySelectedBlockCommand)
      .add('formatText', formatTextCommand)
      .add('formatBlock', formatBlockCommand)
      .add('formatNative', formatNativeCommand)
      .add('getBlockSelections', getBlockSelectionsCommand)
      .add('getTextSelection', getTextSelectionCommand);
  }

  override unmounted() {
    super.unmounted();
    this.selectionManager.set([]);
  }
}

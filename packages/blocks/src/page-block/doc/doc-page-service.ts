import { BlockService } from '@blocksuite/block-std';

import {
  copySelectedBlockCommand,
  deleteSelectedBlockCommand,
  deleteSelectedTextCommand,
  getBlockIndexCommand,
  getBlockSelectionsCommand,
  getNextBlockCommand,
  getPrevBlockCommand,
  getSelectedModelsCommand,
  getTextSelectionCommand,
} from '../commands/index.js';

export class DocPageService extends BlockService {
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
      .add('getBlockSelections', getBlockSelectionsCommand)
      .add('getTextSelection', getTextSelectionCommand);
  }
}

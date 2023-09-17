import { BlockService } from '@blocksuite/block-std';

import {
  copySelectedBlockCommand,
  deleteSelectedBlockCommand,
  deleteSelectedTextCommand,
  getBlockIndexCommand,
  getNextBlockCommand,
  getPreviousBlockCommand,
  getSelectedModelsCommand,
} from '../commands/index.js';

export class DocPageService extends BlockService {
  override mounted() {
    super.mounted();
    this.std.command
      .add('getNextBlock', getNextBlockCommand)
      .add('getPreviousBlock', getPreviousBlockCommand)
      .add('getSelectedModels', getSelectedModelsCommand)
      .add('getBlockIndex', getBlockIndexCommand)
      .add('deleteSelectedText', deleteSelectedTextCommand)
      .add('deleteSelectedBlock', deleteSelectedBlockCommand)
      .add('copySelectedBlock', copySelectedBlockCommand);
  }
}

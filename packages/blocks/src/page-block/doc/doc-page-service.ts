import { BlockService } from '@blocksuite/block-std';

import { formatBlockCommand } from '../commands/format/format-block.js';
import { formatNativeCommand } from '../commands/format/format-native.js';
import { formatTextCommand } from '../commands/format/format-text.js';
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
    this.std.command.add('formatText', formatTextCommand);
    this.std.command.add('formatBlock', formatBlockCommand);
    this.std.command.add('formatNative', formatNativeCommand);
  }
}

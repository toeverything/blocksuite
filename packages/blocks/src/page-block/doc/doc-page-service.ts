import { BlockService } from '@blocksuite/block-std';

import {
  getBlockIndexCommand,
  getNextBlockCommand,
  getPreviousBlockCommand,
  getSelectedModelsCommand,
} from '../commands/index.js';

export class DocPageService extends BlockService {
  override mounted() {
    super.mounted();
    this.std.command.add('getNextBlock', getNextBlockCommand);
    this.std.command.add('getPreviousBlock', getPreviousBlockCommand);
    this.std.command.add('getSelectedModels', getSelectedModelsCommand);
    this.std.command.add('getBlockIndex', getBlockIndexCommand);
  }
}

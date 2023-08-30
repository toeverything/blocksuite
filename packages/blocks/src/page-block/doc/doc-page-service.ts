import { BlockService } from '@blocksuite/block-std';

import {
  getNextBlockCommand,
  getPreviousBlockCommand,
} from '../commands/index.js';

export class DocPageService extends BlockService {
  override mounted() {
    super.mounted();
    this.store.commandManager.register('getNextBlock', getNextBlockCommand);
    this.store.commandManager.register(
      'getPreviousBlock',
      getPreviousBlockCommand
    );
  }
}

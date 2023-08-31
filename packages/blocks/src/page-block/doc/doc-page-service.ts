import { BlockService } from '@blocksuite/block-std';

import {
  getNextBlockCommand,
  getPreviousBlockCommand,
} from '../commands/index.js';

export class DocPageService extends BlockService {
  override mounted() {
    super.mounted();
    this.store.commandManager.add('getNextBlock', getNextBlockCommand);
    this.store.commandManager.add('getPreviousBlock', getPreviousBlockCommand);
  }
}

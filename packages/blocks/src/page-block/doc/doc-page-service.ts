import { BlockService } from '@blocksuite/block-std';

import {
  getNextBlockCommand,
  getPreviousBlockCommand,
} from '../commands/index.js';

export class DocPageService extends BlockService {
  override mounted() {
    super.mounted();
    this.store.command.add('getNextBlock', getNextBlockCommand);
    this.store.command.add('getPreviousBlock', getPreviousBlockCommand);
  }
}

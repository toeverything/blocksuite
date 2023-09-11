import { BlockService } from '@blocksuite/block-std';

import {
  getNextBlockCommand,
  getPreviousBlockCommand,
} from '../commands/index.js';

export class DocPageService extends BlockService {
  override mounted() {
    super.mounted();
    this.std.command.add('getNextBlock', getNextBlockCommand);
    this.std.command.add('getPreviousBlock', getPreviousBlockCommand);
  }
}

import { BlockService } from '@blocksuite/block-std';

import { currentTextBlock } from '../commands/index.js';

export class DocPageService extends BlockService {
  override mounted() {
    super.mounted();

    this.store.commandManager.register('currentTextBlock', currentTextBlock);
  }
}

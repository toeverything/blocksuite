import type { BlockCommands } from '@blocksuite/block-std';

import { addEdgelessTextBlockCommand } from './insert-edgeless-text.js';

export const commands: BlockCommands = {
  addEdgelessTextBlock: addEdgelessTextBlockCommand,
};

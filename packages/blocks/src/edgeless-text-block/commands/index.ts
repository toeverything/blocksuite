import type { BlockCommands } from '@blocksuite/block-std';

import { insertEdgelessTextCommand } from './insert-edgeless-text.js';

export const commands: BlockCommands = {
  insertEdgelessText: insertEdgelessTextCommand,
};

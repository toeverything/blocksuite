import type { BlockCommands } from '@blocksuite/block-std';

import { getImageSelectionsCommand } from '@blocksuite/affine-shared/commands';

export const commands: BlockCommands = {
  getImageSelections: getImageSelectionsCommand,
};

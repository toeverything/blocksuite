import type { BlockCommands } from '@blocksuite/block-std';

import { getImageSelectionsCommand } from '@blocksuite/affine-shared/commands';

import { insertImagesCommand } from './insert-images.js';

export const commands: BlockCommands = {
  getImageSelections: getImageSelectionsCommand,
  insertImages: insertImagesCommand,
};

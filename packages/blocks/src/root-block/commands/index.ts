import type { BlockCommands } from '@blocksuite/block-std';

import {
  getSelectedPeekableBlocksCommand,
  peekSelectedBlockCommand,
} from '@blocksuite/affine-components/peek';
import { textCommands } from '@blocksuite/affine-components/rich-text';
import {
  copySelectedModelsCommand,
  deleteSelectedModelsCommand,
  draftSelectedModelsCommand,
  getSelectedModelsCommand,
} from '@blocksuite/affine-shared/commands';

export const commands: BlockCommands = {
  // models
  copySelectedModels: copySelectedModelsCommand,
  deleteSelectedModels: deleteSelectedModelsCommand,
  draftSelectedModels: draftSelectedModelsCommand,
  getSelectedModels: getSelectedModelsCommand,
  // text
  ...textCommands,
  // peekable
  peekSelectedBlock: peekSelectedBlockCommand,
  getSelectedPeekableBlocks: getSelectedPeekableBlocksCommand,
};

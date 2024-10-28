import type { BlockCommands } from '@blocksuite/block-std';

import {
  getSelectedPeekableBlocksCommand,
  peekSelectedBlockCommand,
} from '@blocksuite/affine-components/peek';
import { textCommands } from '@blocksuite/affine-components/rich-text';
import {
  clearAndSelectFirstModelCommand,
  copySelectedModelsCommand,
  deleteSelectedModelsCommand,
  draftSelectedModelsCommand,
  getSelectedModelsCommand,
  retainFirstModelCommand,
} from '@blocksuite/affine-shared/commands';

export const commands: BlockCommands = {
  // models
  clearAndSelectFirstModel: clearAndSelectFirstModelCommand,
  copySelectedModels: copySelectedModelsCommand,
  deleteSelectedModels: deleteSelectedModelsCommand,
  draftSelectedModels: draftSelectedModelsCommand,
  getSelectedModels: getSelectedModelsCommand,
  retainFirstModel: retainFirstModelCommand,
  // text
  ...textCommands,
  // peekable
  peekSelectedBlock: peekSelectedBlockCommand,
  getSelectedPeekableBlocks: getSelectedPeekableBlocksCommand,
};

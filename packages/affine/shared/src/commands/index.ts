import type { BlockStdScope } from '@blocksuite/block-std';

import {
  getBlockIndexCommand,
  getNextBlockCommand,
  getPrevBlockCommand,
  getSelectedBlocksCommand,
} from './block-crud/index.js';
import {
  copySelectedModelsCommand,
  deleteSelectedModelsCommand,
  draftSelectedModelsCommand,
  getSelectedModelsCommand,
} from './model-crud/index.js';
import {
  getBlockSelectionsCommand,
  getImageSelectionsCommand,
  getTextSelectionCommand,
} from './selection/index.js';

export {
  getBlockIndexCommand,
  getNextBlockCommand,
  getPrevBlockCommand,
  getSelectedBlocksCommand,
} from './block-crud/index.js';
export {
  copySelectedModelsCommand,
  deleteSelectedModelsCommand,
  draftSelectedModelsCommand,
  getSelectedModelsCommand,
} from './model-crud/index.js';
export {
  getBlockSelectionsCommand,
  getImageSelectionsCommand,
  getTextSelectionCommand,
} from './selection/index.js';

declare global {
  namespace BlockSuite {
    // if we use `with` or `inline` to add command data either then use a command we
    // need to update this interface
    interface CommandContext {
      currentSelectionPath?: string;
    }
  }
}

export const registerCommands = (std: BlockStdScope) => {
  std.command
    .add('getBlockIndex', getBlockIndexCommand)
    .add('getNextBlock', getNextBlockCommand)
    .add('getPrevBlock', getPrevBlockCommand)
    .add('getSelectedBlocks', getSelectedBlocksCommand)
    .add('copySelectedModels', copySelectedModelsCommand)
    .add('deleteSelectedModels', deleteSelectedModelsCommand)
    .add('draftSelectedModels', draftSelectedModelsCommand)
    .add('getSelectedModels', getSelectedModelsCommand)
    .add('getBlockSelections', getBlockSelectionsCommand)
    .add('getImageSelections', getImageSelectionsCommand)
    .add('getTextSelection', getTextSelectionCommand);
};

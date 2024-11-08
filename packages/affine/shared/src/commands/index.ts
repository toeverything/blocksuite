export {
  getBlockIndexCommand,
  getNextBlockCommand,
  getPrevBlockCommand,
  getSelectedBlocksCommand,
} from './block-crud/index.js';
export {
  clearAndSelectFirstModelCommand,
  copySelectedModelsCommand,
  deleteSelectedModelsCommand,
  draftSelectedModelsCommand,
  duplicateSelectedModelsCommand,
  getSelectedModelsCommand,
  retainFirstModelCommand,
} from './model-crud/index.js';
export {
  getBlockSelectionsCommand,
  getImageSelectionsCommand,
  getSelectionRectsCommand,
  getTextSelectionCommand,
  type SelectionRect,
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

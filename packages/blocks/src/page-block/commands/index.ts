export * from './copy-selected-block.js';
export * from './delete-selected-block.js';
export * from './delete-selected-text.js';
export * from './get-block-index.js';
export * from './get-block-selection-by-side.js';
export * from './get-next-block.js';
export * from './get-prev-block.js';
export * from './get-selected-models.js';
export * from './get-text-selection.js';

declare global {
  namespace BlockSuite {
    interface CommandData {
      currentSelectionPath: string[];
    }
  }
}

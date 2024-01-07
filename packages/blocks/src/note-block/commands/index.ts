import type { BlockElement } from '@blocksuite/lit';

export * from './change-text-selection-sideways.js';
export * from './change-text-selection-sideways-to-block.js';
export * from './change-text-selection-to-block-start-end.js';
export * from './change-text-selection-vertically.js';
export * from './move-cursor-to-block.js';
export * from './move-cursor-vertically.js';
export * from './select-block.js';
export * from './select-block-text-by-side.js';
export * from './select-blocks-between.js';

declare global {
  namespace BlockSuite {
    interface CommandContext {
      focusBlock?: BlockElement | null;

      anchorBlock?: BlockElement | null;
    }
  }
}

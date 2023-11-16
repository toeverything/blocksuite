import type { BlockElement } from '@blocksuite/lit';

export * from './change-text-selection-sideways.js';
export * from './change-text-selection-sideways-to-block.js';
export * from './change-text-selection-to-block-start-end.js';
export * from './change-text-selection-vertically.js';
export * from './move-cursor-to-block.js';
export * from './move-cursor-vertically.js';

declare global {
  namespace BlockSuite {
    interface CommandData {
      targetBlock?: BlockElement | null;
    }
  }
}

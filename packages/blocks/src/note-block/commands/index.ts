import type { BlockElement } from '@blocksuite/lit';

export * from './select-block.js';
export * from './select-blocks-between.js';
export * from './text-style.js';

declare global {
  namespace BlockSuite {
    interface CommandContext {
      focusBlock?: BlockElement | null;

      anchorBlock?: BlockElement | null;
    }
  }
}

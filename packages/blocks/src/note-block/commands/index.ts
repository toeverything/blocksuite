import type { BlockElement } from '@blocksuite/block-std';

export * from './block-type.js';
export * from './select-block.js';
export * from './select-blocks-between.js';
export * from './text-style.js';

declare global {
  namespace BlockSuite {
    interface CommandContext {
      anchorBlock?: BlockElement | null;

      focusBlock?: BlockElement | null;
    }
  }
}

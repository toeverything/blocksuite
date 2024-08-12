import type { BlockComponent } from '@blocksuite/block-std';

export * from './block-type.js';
export * from './select-block.js';
export * from './select-blocks-between.js';

declare global {
  namespace BlockSuite {
    interface CommandContext {
      focusBlock?: BlockComponent | null;

      anchorBlock?: BlockComponent | null;
    }
  }
}

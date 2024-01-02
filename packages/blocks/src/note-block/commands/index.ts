import type { BlockElement } from '@blocksuite/lit';

export * from './select-block.js';
export * from './select-blocks-between.js';

declare global {
  namespace BlockSuite {
    interface CommandData {
      focusBlock?: BlockElement | null;

      anchorBlock?: BlockElement | null;
    }
  }
}

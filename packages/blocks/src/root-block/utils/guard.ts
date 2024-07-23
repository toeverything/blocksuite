import type { BlockComponent } from '@blocksuite/block-std';

import type { RootBlockComponent } from '../types.js';

export function isRootElement(
  block: BlockComponent
): block is RootBlockComponent {
  return (
    block.tagName === 'AFFINE-PAGE-ROOT' ||
    block.tagName === 'AFFINE-EDGELESS-ROOT'
  );
}

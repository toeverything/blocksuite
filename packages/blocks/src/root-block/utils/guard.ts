import type { BlockElement } from '@blocksuite/block-std';

import type { RootBlockComponent } from '../types.js';

export function isRootElement(
  blockElement: BlockElement
): blockElement is RootBlockComponent {
  return (
    blockElement.tagName === 'AFFINE-PAGE-ROOT' ||
    blockElement.tagName === 'AFFINE-EDGELESS-ROOT'
  );
}

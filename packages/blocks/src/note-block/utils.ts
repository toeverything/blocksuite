import type { BlockComponent } from '@blocksuite/block-std';

export const ensureBlockInContainer = (
  block: BlockComponent,
  containerElement: BlockComponent
) => containerElement.contains(block) && block !== containerElement;

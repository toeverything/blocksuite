import type { BlockElement } from '@blocksuite/lit';

import { DocPageBlockComponent } from '../doc/doc-page-block.js';
import { EdgelessPageBlockComponent } from '../edgeless/edgeless-page-block.js';
import type { PageBlockComponent } from '../types.js';

export function isPageComponent(
  blockElement: BlockElement
): blockElement is PageBlockComponent {
  return (
    blockElement instanceof DocPageBlockComponent ||
    blockElement instanceof EdgelessPageBlockComponent
  );
}

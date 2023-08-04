import type { BlockElement } from '@blocksuite/lit';

import { DocPageBlockComponent } from '../doc/doc-page-block.js';
import { EdgelessPageBlockComponent } from '../edgeless/edgeless-page-block.js';
import type { PageBlockComponent } from '../types.js';

export function isPageComponent(
  host: BlockElement
): host is PageBlockComponent {
  return (
    host instanceof DocPageBlockComponent ||
    host instanceof EdgelessPageBlockComponent
  );
}

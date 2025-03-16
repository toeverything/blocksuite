import type { EdgelessTextBlockModel } from '@blocksuite/affine-model';
import { html, nothing } from 'lit';

import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

export function renderChangeEdgelessTextButton(
  edgeless: EdgelessRootBlockComponent,
  elements?: EdgelessTextBlockModel[]
) {
  if (!elements?.length) return nothing;

  return html`
    <edgeless-change-text-menu
      .elementType=${'edgeless-text'}
      .elements=${elements}
      .edgeless=${edgeless}
    ></edgeless-change-text-menu>
  `;
}

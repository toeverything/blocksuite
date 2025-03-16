import type { TextElementModel } from '@blocksuite/affine-model';
import { html, nothing } from 'lit';

import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

export function renderChangeTextButton(
  edgeless: EdgelessRootBlockComponent,
  elements?: TextElementModel[]
) {
  if (!elements?.length) return nothing;

  return html`
    <edgeless-change-text-menu
      .elementType=${'text'}
      .elements=${elements}
      .edgeless=${edgeless}
    ></edgeless-change-text-menu>
  `;
}

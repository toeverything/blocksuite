import { html, nothing } from 'lit';

import type { EdgelessTextBlockModel } from '../../../edgeless-text/edgeless-text-model.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

import './change-text-menu.js';

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

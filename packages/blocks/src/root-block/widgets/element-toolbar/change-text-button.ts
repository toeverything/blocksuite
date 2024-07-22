import { html, nothing } from 'lit';

import type { TextNode } from '../../../surface-block/index.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

import './change-text-menu.js';

export function renderChangeTextButton(
  edgeless: EdgelessRootBlockComponent,
  elements?: TextNode[]
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

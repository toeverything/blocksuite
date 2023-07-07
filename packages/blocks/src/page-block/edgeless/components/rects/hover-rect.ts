import { matchFlavours } from '@blocksuite/store';
import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import { isTopLevelBlock } from '../../utils/query.js';
import type { EdgelessHoverState } from '../../utils/selection-manager.js';

export function EdgelessHoverRect(hoverState: EdgelessHoverState | null) {
  if (!hoverState) return null;
  const rect = hoverState.rect;
  const isNote =
    isTopLevelBlock(hoverState.content) &&
    matchFlavours(hoverState.content, ['affine:note']);

  const style = {
    left: rect.x + 'px',
    top: rect.y + 'px',
    width: rect.width + 'px',
    height: rect.height + 'px',
    backgroundColor: isNote ? 'var(--affine-hover-color)' : '',
  };

  return html`
    <div class="affine-edgeless-hover-rect" style=${styleMap(style)}></div>
  `;
}

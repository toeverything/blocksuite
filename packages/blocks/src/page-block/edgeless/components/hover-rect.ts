import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessHoverState } from '../selection-manager.js';
import { getCommonRectStyle } from './utils.js';

export function EdgelessHoverRect(
  hoverState: EdgelessHoverState | null,
  zoom: number
) {
  if (!hoverState) return null;
  const rect = hoverState.rect;

  const style = getCommonRectStyle(rect);

  return html`
    <div class="affine-edgeless-hover-rect" style=${styleMap(style)}></div>
  `;
}

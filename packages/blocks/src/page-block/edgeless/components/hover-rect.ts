import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessHoverState } from '../selection-manager.js';
import { isSurfaceElement } from '../utils.js';
import { getCommonRectStyle } from './utils.js';

export function EdgelessHoverRect(
  hoverState: EdgelessHoverState | null,
  zoom: number
) {
  if (!hoverState) return null;
  const rect = hoverState.rect;
  const isInSurface = isSurfaceElement(hoverState.content);

  const style = {
    ...getCommonRectStyle(rect, zoom, isInSurface),
    border: '1px solid var(--affine-primary-color)',
  };

  return html`
    <div class="affine-edgeless-hover-rect" style=${styleMap(style)}></div>
  `;
}

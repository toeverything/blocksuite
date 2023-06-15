import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import type { IPoint } from '../../__internal__/index.js';

export function DraggingArea(rect: DOMRect | null) {
  if (rect === null) return null;

  const style = {
    left: rect.left + 'px',
    top: rect.top + 'px',
    width: rect.width + 'px',
    height: rect.height + 'px',
  };
  return html`
    <style>
      .affine-page-dragging-area {
        position: absolute;
        background: var(--affine-hover-color);
        z-index: 1;
        pointer-events: none;
      }
    </style>
    <div class="affine-page-dragging-area" style=${styleMap(style)}></div>
  `;
}

export function EmbedSelectedRectsContainer(
  rects: DOMRect[],
  viewportOffset: IPoint
) {
  return html`
    <style>
      .affine-page-selected-embed-rects-container > .resizes {
        position: absolute;
        display: block;
        border: 2px solid var(--affine-primary-color);
        user-select: none;
      }
      .affine-page-selected-embed-rects-container .resize {
        pointer-events: auto;
      }
    </style>
    <div class="affine-page-selected-embed-rects-container resizable">
      ${rects.map(rect => {
        const style = {
          left: rect.left + viewportOffset.x + 'px',
          top: rect.top + viewportOffset.y + 'px',
          width: rect.width + 'px',
          height: rect.height + 'px',
          pointerEvents: 'none',
        };
        return html`
          <div class="resizes" style=${styleMap(style)}>
            <div class="resize top-left"></div>
            <div class="resize top-right"></div>
            <div class="resize bottom-left"></div>
            <div class="resize bottom-right"></div>
          </div>
        `;
      })}
    </div>
  `;
}

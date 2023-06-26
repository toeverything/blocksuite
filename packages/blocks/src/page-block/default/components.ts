import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

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

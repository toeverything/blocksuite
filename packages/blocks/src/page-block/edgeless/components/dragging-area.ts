import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

export function EdgelessDraggingArea(rect: DOMRect | null) {
  if (rect === null) return html``;

  const style = {
    left: rect.left + 'px',
    top: rect.top + 'px',
    width: rect.width + 'px',
    height: rect.height + 'px',
  };
  return html`
    <style>
      .affine-edgeless-dragging-area {
        position: absolute;
        background: var(--affine-hover-color);
        z-index: 1;
        pointer-events: none;
      }
    </style>
    <div class="affine-edgeless-dragging-area" style=${styleMap(style)}></div>
  `;
}

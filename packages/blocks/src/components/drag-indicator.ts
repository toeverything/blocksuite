import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { type Rect } from '../__internal__/index.js';

@customElement('affine-drag-indicator')
export class DragIndicator extends LitElement {
  static override styles = css`
    .affine-drag-indicator {
      position: absolute;
      top: 0;
      left: 0;
      background: var(--affine-primary-color);
      transition-property: width, height, transform;
      transition-duration: 100ms;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-delay: 0s;
      transform-origin: 0 0;
      pointer-events: none;
      z-index: 2;
    }
  `;

  @property({ attribute: false })
  rect: Rect | null = null;

  override render() {
    if (!this.rect) {
      return null;
    }
    const { left, top, width, height } = this.rect;
    const style = styleMap({
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${left}px, ${top}px)`,
    });
    return html`<div class="affine-drag-indicator" style=${style}></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-drag-indicator': DragIndicator;
  }
}

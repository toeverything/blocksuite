import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

@customElement('affine-database-column-drag-indicator')
export class ColumnDragIndicator extends LitElement {
  static styles = css`
    .affine-database-column-drag-indicator {
      position: fixed;
      z-index: 10;
      top: 0;
      left: 0;
      background: var(--affine-primary-color);
      transition-property: width, transform;
      transition-duration: 100ms;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-delay: 0s;
      pointer-events: none;
    }
  `;

  @property()
  targetRect: DOMRect | null = null;

  @property()
  scale = 1;

  override render() {
    if (!this.targetRect) {
      return null;
    }

    const rect = this.targetRect;
    const style = styleMap({
      width: `${3 * this.scale}px`,
      height: `${rect.height}px`,
      transform: `translate(${rect.left}px, ${rect.top}px)`,
    });

    return html`
      <div class="affine-database-column-drag-indicator" style=${style}></div>
    `;
  }
}

import { WithDisposable } from '@blocksuite/lit';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';

@customElement('edgeless-dragging-area-rect')
export class EdgelessHoverRect extends WithDisposable(LitElement) {
  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  protected override firstUpdated() {
    this._disposables.add(
      this.edgeless.slots.hoverUpdated.on(() => this.requestUpdate())
    );
  }

  protected override render() {
    const rect = this.edgeless.tools.draggingArea;
    if (rect === null) return nothing;

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
}

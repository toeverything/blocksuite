import { WithDisposable } from '@blocksuite/block-std';
import { cssVarV2 } from '@toeverything/theme/v2';
import { LitElement, css, html, nothing, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';

@customElement('edgeless-dragging-area-rect')
export class EdgelessDraggingAreaRect extends WithDisposable(LitElement) {
  static override styles = css`
    .affine-edgeless-dragging-area {
      position: absolute;
      background: ${unsafeCSS(
        cssVarV2('edgeless/selection/selectionMarqueeBackground', '#1E96EB14')
      )};
      box-sizing: border-box;
      border-width: 1px;
      border-style: solid;
      border-color: ${unsafeCSS(
        cssVarV2('edgeless/selection/selectionMarqueeBorder', '#1E96EB')
      )};

      z-index: 1;
      pointer-events: none;
    }
  `;

  protected override firstUpdated() {
    this._disposables.add(
      this.edgeless.slots.draggingAreaUpdated.on(() => this.requestUpdate())
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
      <div class="affine-edgeless-dragging-area" style=${styleMap(style)}></div>
    `;
  }

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-dragging-area-rect': EdgelessDraggingAreaRect;
  }
}

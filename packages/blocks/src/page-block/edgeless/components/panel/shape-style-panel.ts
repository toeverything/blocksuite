import {
  GeneralShapeStyleIcon,
  ScribbledShapeStyleIcon,
} from '@blocksuite/global/config';
import { ShapeStyle } from '@blocksuite/phasor';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('edgeless-shape-style-panel')
export class EdgelessShapeStylePanel extends LitElement {
  static override styles = css`
    :host {
      display: flex;
    }

    .shape-style-container {
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--affine-background-overlay-panel-color);
      gap: 10px;
    }

    edgeless-tool-icon-button svg {
      fill: var(--affine-icon-color);
    }
  `;

  @property({ attribute: false })
  value!: ShapeStyle;

  @property({ attribute: false })
  onSelect?: (value: EdgelessShapeStylePanel['value']) => void;

  private _onSelect(value: EdgelessShapeStylePanel['value']) {
    this.value = value;
    if (this.onSelect) {
      this.onSelect(value);
    }
  }

  override render() {
    return html`
      <div class="shape-style-container">
        <edgeless-tool-icon-button
          class="general-shape-button"
          .tooltip=${'General'}
          .tipPosition=${'top'}
          .active=${this.value === ShapeStyle.General}
          .activeMode=${'background'}
          @click=${() => {
            this._onSelect(ShapeStyle.General);
          }}
        >
          ${GeneralShapeStyleIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          class="scribbled-shape-button"
          .tooltip=${'Scribbled'}
          .tipPosition=${'top'}
          .active=${this.value === ShapeStyle.Scribbled}
          .activeMode=${'background'}
          @click=${() => {
            this._onSelect(ShapeStyle.Scribbled);
          }}
        >
          ${ScribbledShapeStyleIcon}
        </edgeless-tool-icon-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-shape-style-panel': EdgelessShapeStylePanel;
  }
}

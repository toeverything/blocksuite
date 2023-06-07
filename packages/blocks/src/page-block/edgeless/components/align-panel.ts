import {
  AlighLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
} from '@blocksuite/global/config';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('edgeless-align-panel')
export class EdgelessAlignPanel extends LitElement {
  static override styles = css`
    :host {
      display: block;
      z-index: 2;
    }
    .align-panel-container {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px;
      fill: none;
      stroke: currentColor;
    }
  `;

  @property()
  value: 'left' | 'center' | 'right' = 'left';

  private _onSelect(value: EdgelessAlignPanel['value']) {
    this.value = value;
    if (this.onSelect) {
      this.onSelect(value);
    }
  }
  @property()
  onSelect?: (value: EdgelessAlignPanel['value']) => void;

  override render() {
    return html`
      <div class="align-panel-container">
        <edgeless-tool-icon-button
          .tooltip=${'Left'}
          .active=${this.value === 'left'}
          @click=${() => {
            this._onSelect('left');
          }}
        >
          ${AlighLeftIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .tooltip=${'Center'}
          .active=${this.value === 'center'}
          @click=${() => {
            this._onSelect('center');
          }}
        >
          ${AlignCenterIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .tooltip=${'Right'}
          .active=${this.value === 'right'}
          @click=${() => {
            this._onSelect('right');
          }}
        >
          ${AlignRightIcon}
        </edgeless-tool-icon-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-align-panel': EdgelessAlignPanel;
  }
}

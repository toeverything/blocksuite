import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
} from '../../../../icons/index.js';

@customElement('edgeless-align-panel')
export class EdgelessAlignPanel extends LitElement {
  static override styles = css`
    :host {
      display: block;
      z-index: 2;
    }
    .align-panel-container {
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--affine-background-overlay-panel-color);
      border-radius: 8px;
      padding: 8px;
      gap: 8px;
    }
    .align-panel-container svg {
      fill: var(--affine-icon-color);
      stroke: none;
    }
  `;

  @property({ attribute: false })
  value: 'left' | 'center' | 'right' = 'left';

  private _onSelect(value: EdgelessAlignPanel['value']) {
    this.value = value;
    if (this.onSelect) {
      this.onSelect(value);
    }
  }
  @property({ attribute: false })
  onSelect?: (value: EdgelessAlignPanel['value']) => void;

  override render() {
    return html`
      <div class="align-panel-container">
        <edgeless-tool-icon-button
          .tooltip=${'Left'}
          .active=${this.value === 'left'}
          .activeMode=${'background'}
          .iconContainerPadding=${2}
          @click=${() => {
            this._onSelect('left');
          }}
        >
          ${TextAlignLeftIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .tooltip=${'Center'}
          .active=${this.value === 'center'}
          .activeMode=${'background'}
          .iconContainerPadding=${2}
          @click=${() => {
            this._onSelect('center');
          }}
        >
          ${TextAlignCenterIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .tooltip=${'Right'}
          .active=${this.value === 'right'}
          .activeMode=${'background'}
          .iconContainerPadding=${2}
          @click=${() => {
            this._onSelect('right');
          }}
        >
          ${TextAlignRightIcon}
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

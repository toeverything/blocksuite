import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { CanvasTextFont } from '../../utils/consts.js';

@customElement('edgeless-font-family-panel')
export class EdgelessFontFamilyPanel extends LitElement {
  static override styles = css`
    :host {
      display: flex;
    }

    .font-family-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--affine-background-overlay-panel-color);
      gap: 8px;
      padding: 8px;
    }

    .inter {
      font-family: 'Inter', sans-serif;
    }

    .kalam {
      font-family: 'Kalam', sans-serif;
    }

    .satoshi {
      font-family: 'Satoshi', sans-serif;
    }

    .poppins {
      font-family: 'Poppins', sans-serif;
    }

    .lora {
      font-family: 'Lora', sans-serif;
    }

    .bebas-neue {
      font-family: 'Bebas Neue', sans-serif;
    }

    .orelega-one {
      font-family: 'Orelega One', sans-serif;
    }
  `;

  @property({ attribute: false })
  value = CanvasTextFont.Inter;

  @property({ attribute: false })
  onSelect?: (value: EdgelessFontFamilyPanel['value']) => void;

  private _onSelect(value: EdgelessFontFamilyPanel['value']) {
    this.value = value;
    if (this.onSelect) {
      this.onSelect(value);
    }
  }

  override render() {
    return html`
      <div class="font-family-container">
        <edgeless-tool-icon-button
          class="inter"
          .active=${this.value === CanvasTextFont.Inter}
          .activeMode=${'background'}
          .iconContainerPadding=${2}
          @click=${() => {
            this._onSelect(CanvasTextFont.Inter);
          }}
        >
          <div class="font-family-button">Inter</div>
        </edgeless-tool-icon-button>

        <edgeless-tool-icon-button
          class="kalam"
          .active=${this.value === CanvasTextFont.Kalam}
          .activeMode=${'background'}
          .iconContainerPadding=${2}
          @click=${() => {
            this._onSelect(CanvasTextFont.Kalam);
          }}
        >
          <div class="font-family-button">Kalam</div>
        </edgeless-tool-icon-button>

        <edgeless-tool-icon-button
          class="satoshi"
          .active=${this.value === CanvasTextFont.Satoshi}
          .activeMode=${'background'}
          .iconContainerPadding=${2}
          @click=${() => {
            this._onSelect(CanvasTextFont.Satoshi);
          }}
        >
          <div class="font-family-button">Satoshi</div>
        </edgeless-tool-icon-button>

        <edgeless-tool-icon-button
          class="poppins"
          .active=${this.value === CanvasTextFont.Poppins}
          .activeMode=${'background'}
          .iconContainerPadding=${2}
          @click=${() => {
            this._onSelect(CanvasTextFont.Poppins);
          }}
        >
          <div class="font-family-button">Poppins</div>
        </edgeless-tool-icon-button>

        <edgeless-tool-icon-button
          class="lora"
          .active=${this.value === CanvasTextFont.Lora}
          .activeMode=${'background'}
          .iconContainerPadding=${2}
          @click=${() => {
            this._onSelect(CanvasTextFont.Lora);
          }}
        >
          <div class="font-family-button">Lora</div>
        </edgeless-tool-icon-button>

        <edgeless-tool-icon-button
          class="bebas-neue"
          .active=${this.value === CanvasTextFont.BebasNeue}
          .activeMode=${'background'}
          .iconContainerPadding=${2}
          @click=${() => {
            this._onSelect(CanvasTextFont.BebasNeue);
          }}
        >
          <div class="font-family-button">Bebas Neue</div>
        </edgeless-tool-icon-button>

        <edgeless-tool-icon-button
          class="orelega-one"
          .active=${this.value === CanvasTextFont.OrelegaOne}
          .activeMode=${'background'}
          .iconContainerPadding=${2}
          @click=${() => {
            this._onSelect(CanvasTextFont.OrelegaOne);
          }}
        >
          <div class="font-family-button">Orelega One</div>
        </edgeless-tool-icon-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-font-family-panel': EdgelessFontFamilyPanel;
  }
}

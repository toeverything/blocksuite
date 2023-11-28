import { css, html, LitElement, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { CanvasTextFontFamily } from '../../../../surface-block/consts.js';
import { wrapFontFamily } from '../../../../surface-block/elements/text/utils.js';

@customElement('edgeless-font-family-panel')
export class EdgelessFontFamilyPanel extends LitElement {
  static override styles = css`
    :host {
      display: flex;
    }

    .font-family-container {
      display: flex;
      flex-direction: column;
      align-items: start;
      justify-content: center;
      background: var(--affine-background-overlay-panel-color);
      gap: 8px;
      padding: 8px;
    }

    .font-family-container edgeless-tool-icon-button {
      width: 100%;
    }

    .inter {
      font-family: ${unsafeCSS(wrapFontFamily(CanvasTextFontFamily.Inter))},
        sans-serif;
    }

    .kalam {
      font-family: ${unsafeCSS(wrapFontFamily(CanvasTextFontFamily.Kalam))},
        sans-serif;
    }

    .satoshi {
      font-family: ${unsafeCSS(wrapFontFamily(CanvasTextFontFamily.Satoshi))},
        sans-serif;
    }

    .poppins {
      font-family: ${unsafeCSS(wrapFontFamily(CanvasTextFontFamily.Poppins))},
        sans-serif;
    }

    .lora {
      font-family: ${unsafeCSS(wrapFontFamily(CanvasTextFontFamily.Lora))},
        sans-serif;
    }

    .bebas-neue {
      font-family: ${unsafeCSS(wrapFontFamily(CanvasTextFontFamily.BebasNeue))},
        sans-serif;
    }

    .orelega-one {
      font-family: ${unsafeCSS(wrapFontFamily(CanvasTextFontFamily.OrelegaOne))},
        sans-serif;
    }
  `;

  @property({ attribute: false })
  value = CanvasTextFontFamily.Inter;

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
          .active=${this.value === CanvasTextFontFamily.Inter}
          .activeMode=${'background'}
          .iconContainerPadding=${2}
          @click=${() => {
            this._onSelect(CanvasTextFontFamily.Inter);
          }}
        >
          <div class="font-family-button">Inter</div>
        </edgeless-tool-icon-button>

        <edgeless-tool-icon-button
          class="kalam"
          .active=${this.value === CanvasTextFontFamily.Kalam}
          .activeMode=${'background'}
          .iconContainerPadding=${2}
          @click=${() => {
            this._onSelect(CanvasTextFontFamily.Kalam);
          }}
        >
          <div class="font-family-button">Kalam</div>
        </edgeless-tool-icon-button>

        <edgeless-tool-icon-button
          class="satoshi"
          .active=${this.value === CanvasTextFontFamily.Satoshi}
          .activeMode=${'background'}
          .iconContainerPadding=${2}
          @click=${() => {
            this._onSelect(CanvasTextFontFamily.Satoshi);
          }}
        >
          <div class="font-family-button">Satoshi</div>
        </edgeless-tool-icon-button>

        <edgeless-tool-icon-button
          class="poppins"
          .active=${this.value === CanvasTextFontFamily.Poppins}
          .activeMode=${'background'}
          .iconContainerPadding=${2}
          @click=${() => {
            this._onSelect(CanvasTextFontFamily.Poppins);
          }}
        >
          <div class="font-family-button">Poppins</div>
        </edgeless-tool-icon-button>

        <edgeless-tool-icon-button
          class="lora"
          .active=${this.value === CanvasTextFontFamily.Lora}
          .activeMode=${'background'}
          .iconContainerPadding=${2}
          @click=${() => {
            this._onSelect(CanvasTextFontFamily.Lora);
          }}
        >
          <div class="font-family-button">Lora</div>
        </edgeless-tool-icon-button>

        <edgeless-tool-icon-button
          class="bebas-neue"
          .active=${this.value === CanvasTextFontFamily.BebasNeue}
          .activeMode=${'background'}
          .iconContainerPadding=${2}
          @click=${() => {
            this._onSelect(CanvasTextFontFamily.BebasNeue);
          }}
        >
          <div class="font-family-button">Bebas Neue</div>
        </edgeless-tool-icon-button>

        <edgeless-tool-icon-button
          class="orelega-one"
          .active=${this.value === CanvasTextFontFamily.OrelegaOne}
          .activeMode=${'background'}
          .iconContainerPadding=${2}
          @click=${() => {
            this._onSelect(CanvasTextFontFamily.OrelegaOne);
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

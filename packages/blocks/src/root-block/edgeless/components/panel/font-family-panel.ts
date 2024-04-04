import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { CanvasTextFontFamily } from '../../../../surface-block/consts.js';
import { wrapFontFamily } from '../../../../surface-block/utils/font.js';

export const CanvasTextFontFamiliesNames: Record<
  keyof typeof CanvasTextFontFamily,
  string
> = {
  Inter: 'Inter',
  Kalam: 'Kalam',
  Satoshi: 'Satoshi',
  Poppins: 'Poppins',
  Lora: 'Lora',
  BebasNeue: 'Bebas Neue',
  OrelegaOne: 'Orelega One',
};

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
      border-radius: 8px;
    }

    .font-family-container edgeless-tool-icon-button {
      width: 100%;
    }
  `;

  @property({ attribute: false })
  value = CanvasTextFontFamily.Inter;

  @property({ attribute: false })
  options = Object.keys(
    CanvasTextFontFamily
  ) as (keyof typeof CanvasTextFontFamily)[];

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
        ${this.options.map(key => {
          const font = CanvasTextFontFamily[key];

          return html`
            <edgeless-tool-icon-button
              style="font-family: ${wrapFontFamily(font)}"
              .active=${this.value === font}
              .activeMode=${'background'}
              .iconContainerPadding=${2}
              @click=${() => {
                this._onSelect(font);
              }}
            >
              <div class="font-family-button">
                ${CanvasTextFontFamiliesNames[key]}
              </div>
            </edgeless-tool-icon-button>
          `;
        })}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-font-family-panel': EdgelessFontFamilyPanel;
  }
}

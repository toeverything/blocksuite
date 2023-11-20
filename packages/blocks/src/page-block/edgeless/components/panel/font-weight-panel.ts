import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  CanvasTextFontFamily,
  CanvasTextFontWeight,
} from '../../../../surface-block/consts.js';
import {
  checkFontFamily,
  isFontWeightSupported,
} from '../../../../surface-block/elements/text/utils.js';

@customElement('edgeless-font-weight-panel')
export class EdgelessFontWeightPanel extends LitElement {
  static override styles = css`
    :host {
      display: flex;
    }

    .font-weight-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--affine-background-overlay-panel-color);
      gap: 8px;
      padding: 8px;
    }
  `;

  @property({ attribute: false })
  font = CanvasTextFontFamily.Inter;

  @property({ attribute: false })
  value = CanvasTextFontWeight.Regular;

  @property({ attribute: false })
  onSelect?: (value: CanvasTextFontWeight) => void;

  private _onSelect(value: CanvasTextFontWeight) {
    this.value = value;
    if (this.onSelect) {
      this.onSelect(value);
    }
  }

  override render() {
    return html`
      <div class="font-weight-container">
        <edgeless-tool-icon-button
          class="light"
          .disabled=${checkFontFamily(this.font) &&
          !isFontWeightSupported(this.font, CanvasTextFontWeight.Light)}
          .active=${this.value === CanvasTextFontWeight.Light}
          .activeMode=${'background'}
          .iconContainerPadding=${2}
          @click=${() => {
            this._onSelect(CanvasTextFontWeight.Light);
          }}
        >
          <div>Light</div>
        </edgeless-tool-icon-button>

        <edgeless-tool-icon-button
          class="regular"
          .disabled=${checkFontFamily(this.font) &&
          !isFontWeightSupported(this.font, CanvasTextFontWeight.Regular)}
          .active=${this.value === CanvasTextFontWeight.Regular}
          .activeMode=${'background'}
          .iconContainerPadding=${2}
          @click=${() => {
            this._onSelect(CanvasTextFontWeight.Regular);
          }}
        >
          <div>Regular</div>
        </edgeless-tool-icon-button>

        <edgeless-tool-icon-button
          class="semi-bold"
          .disabled=${checkFontFamily(this.font) &&
          !isFontWeightSupported(this.font, CanvasTextFontWeight.SemiBold)}
          .active=${this.value === CanvasTextFontWeight.SemiBold}
          .activeMode=${'background'}
          .iconContainerPadding=${2}
          @click=${() => {
            this._onSelect(CanvasTextFontWeight.SemiBold);
          }}
        >
          <div>Semibold</div>
        </edgeless-tool-icon-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-font-weight-panel': EdgelessFontWeightPanel;
  }
}

import { SHAPE_TEXT_FONT_SIZE } from '@blocksuite/phasor/elements/shape/constants.js';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('edgeless-font-size-panel')
export class EdgelessFontSizePanel extends LitElement {
  static override styles = css`
    :host {
      display: flex;
    }

    .font-size-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--affine-background-overlay-panel-color);
    }

    .font-size-button {
      font-size: 16px;
    }
  `;

  @property({ attribute: false })
  fontSize!: number;

  private _onSelect(fontSize: EdgelessFontSizePanel['fontSize']) {
    this.fontSize = fontSize;
    if (this.onSelect) {
      this.onSelect(fontSize);
    }
  }

  @property({ attribute: false })
  onSelect?: (fontSize: EdgelessFontSizePanel['fontSize']) => void;

  override render() {
    return html`
      <div class="font-size-container">
        <edgeless-tool-icon-button
          .active=${this.fontSize === SHAPE_TEXT_FONT_SIZE.SMALL}
          @click=${() => {
            this._onSelect(SHAPE_TEXT_FONT_SIZE.SMALL);
          }}
        >
          <div class="font-size-button">Small</div>
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .active=${this.fontSize === SHAPE_TEXT_FONT_SIZE.MEDIUM}
          @click=${() => {
            this._onSelect(SHAPE_TEXT_FONT_SIZE.MEDIUM);
          }}
        >
          <div class="font-size-button">Middle</div>
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .active=${this.fontSize === SHAPE_TEXT_FONT_SIZE.LARGE}
          @click=${() => {
            this._onSelect(SHAPE_TEXT_FONT_SIZE.LARGE);
          }}
        >
          <div class="font-size-button">Large</div>
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .active=${this.fontSize === SHAPE_TEXT_FONT_SIZE.XLARGE}
          @click=${() => {
            this._onSelect(SHAPE_TEXT_FONT_SIZE.XLARGE);
          }}
        >
          <div class="font-size-button">Huge</div>
        </edgeless-tool-icon-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-font-size-panel': EdgelessFontSizePanel;
  }
}

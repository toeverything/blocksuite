import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { TEXT_FONT_SIZE } from '../text/types.js';

const MIN_FONT_SIZE = 1;
const MAX_FONT_SIZE = 200;
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
      text-align: start;
      font-size: var(--affine-font-base);
      width: 48px;
      height: 24px;
      font-weight: 400;
      padding: 4px 8px;
      line-height: 24px;
    }

    .font-size-button:hover {
      cursor: pointer;
      background: var(--affine-hover-color);
    }

    .font-size-button[active] {
      color: var(--affine-primary-color);
    }

    .font-size-input-container {
      display: flex;
      padding: 4px 8px;
    }

    .font-size-input {
      width: 48px;
      border: 1px solid var(--affine-border-color);
      border-radius: 4px;
    }

    .font-size-input::placeholder {
      color: var(--affine-placeholder-color);
    }

    .font-size-input:focus {
      outline-color: var(--affine-primary-color);
    }

    menu-divider {
      width: 100%;
    }
  `;

  @property({ attribute: false })
  fontSize!: number;

  @property({ attribute: false })
  onSelect?: (fontSize: EdgelessFontSizePanel['fontSize']) => void;

  @property({ attribute: false })
  onPopperCose?: () => void;

  @property({ attribute: false })
  minFontSize: number = MIN_FONT_SIZE;

  @property({ attribute: false })
  maxFontSize: number = MAX_FONT_SIZE;

  private _onSelect(fontSize: EdgelessFontSizePanel['fontSize']) {
    if (this.onSelect) this.onSelect(fontSize);
  }

  private _onPopperClose() {
    if (this.onPopperCose) this.onPopperCose();
  }

  private _onInputKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      const input = e.target as HTMLInputElement;
      // Handle edge case where user enters a non-number
      if (isNaN(parseInt(input.value))) {
        input.value = '';
        return;
      }

      let fontSize = parseInt(input.value);
      // Handle edge case when user enters a number that is out of range
      if (fontSize < this.minFontSize) {
        fontSize = this.minFontSize;
      } else if (fontSize > this.maxFontSize) {
        fontSize = this.maxFontSize;
      }

      this._onSelect(fontSize);
      input.value = '';
      this._onPopperClose();
    }
  };

  override render() {
    return html`
      <div class="font-size-container">
        <div
          class="font-size-button"
          role="button"
          ?active=${this.fontSize === TEXT_FONT_SIZE.SMALL}
          @click=${() => {
            this._onSelect(TEXT_FONT_SIZE.SMALL);
          }}
        >
          Small
        </div>
        <div
          class="font-size-button"
          role="button"
          ?active=${this.fontSize === TEXT_FONT_SIZE.MEDIUM}
          @click=${() => {
            this._onSelect(TEXT_FONT_SIZE.MEDIUM);
          }}
        >
          Middle
        </div>
        <div
          class="font-size-button"
          role="button"
          ?active=${this.fontSize === TEXT_FONT_SIZE.LARGE}
          @click=${() => {
            this._onSelect(TEXT_FONT_SIZE.LARGE);
          }}
        >
          Large
        </div>
        <div
          class="font-size-button"
          role="button"
          ?active=${this.fontSize === TEXT_FONT_SIZE.XLARGE}
          @click=${() => {
            this._onSelect(TEXT_FONT_SIZE.XLARGE);
          }}
        >
          Huge
        </div>

        <div
          class="font-size-input-container"
          @click=${(e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <input
            class="font-size-input"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            placeholder=${Math.trunc(this.fontSize)}
            @keypress=${this._onInputKeyPress}
          />
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-font-size-panel': EdgelessFontSizePanel;
  }
}

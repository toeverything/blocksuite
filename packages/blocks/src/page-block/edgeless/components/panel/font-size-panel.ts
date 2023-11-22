import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { stopPropagation } from '../../../../_common/utils/event.js';

const MIN_FONT_SIZE = 1;
const MAX_FONT_SIZE = 2000;
@customElement('edgeless-font-size-panel')
export class EdgelessFontSizePanel extends LitElement {
  static override styles = css`
    .font-size-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px 8px;
      background: var(--affine-background-overlay-panel-color);
      border-radius: 8px;
    }

    .font-size-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 64px;
    }

    .font-size-button {
      display: flex;
      align-items: center;
      justify-content: start;
      width: 64px;
      height: 32px;
      padding: 0 8px;
    }

    .font-size-button[active] .font-size-button-label {
      background: var(--affine-hover-color);
    }

    .font-size-button-label {
      text-align: justify;
      font-size: 15px;
      font-style: normal;
      width: 48px;
      height: 24px;
      font-weight: 400;
      line-height: 24px;
      color: var(--affine-icon-color);
      padding: 0 8px;
      border-radius: 4px;
    }

    .font-size-button-label:hover {
      cursor: pointer;
      background: var(--affine-hover-color);
    }

    .font-size-input-container {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .font-size-input {
      width: 48px;
      height: 18px;
      border: 1px solid var(--affine-border-color);
      border-radius: 8px;
      padding: 4px 8px;
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

  private _onKeydown = (e: KeyboardEvent) => {
    e.stopPropagation();

    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
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
        <div class="font-size-content">
          ${[16, 24, 32, 36, 40, 64, 128].map(
            fontSize => html`
              <div
                class="font-size-button"
                role="button"
                ?active=${this.fontSize === fontSize}
                @click=${() => {
                  this._onSelect(fontSize);
                }}
              >
                <div class="font-size-button-label">${fontSize}</div>
              </div>
            `
          )}

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
              @keydown=${this._onKeydown}
              @input=${stopPropagation}
              @pointerdown=${stopPropagation}
            />
          </div>
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

import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { stopPropagation } from '../../../../_common/utils/event.js';

const MIN_SCALE = 1;
const MAX_SCALE = 400;
@customElement('edgeless-scale-panel')
export class EdgelessScalePanel extends LitElement {
  static override styles = css`
    :host {
      box-shadow: var(--affine-menu-shadow);
    }

    .scale-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      width: 180px;
      box-sizing: border-box;
      background: var(--affine-background-overlay-panel-color);
      border-radius: 8px;
      gap: 12px;
      flex-direction: column;
      font-size: var(--affine-font-sm);
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    }

    .scale-input-container {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .scale-input {
      width: 100%;
      height: 22px;
      border: 1px solid var(--affine-border-color);
      border-radius: 4px;
      padding: 6px 12px;
    }

    .scale-input::placeholder {
      color: var(--affine-placeholder-color);
    }

    .scale-input:focus {
      outline-color: var(--affine-primary-color);
    }

    .scale-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      box-sizing: border-box;
      gap: 4px;
    }

    .scale-button {
      display: flex;
      align-items: center;
      justify-content: start;
      box-sizing: border-box;
      width: 100%;
      height: 30px;
      border-radius: 4px;
      padding: 0 8px;
    }

    .scale-button:hover {
      cursor: pointer;
      background: var(--affine-hover-color);
    }

    .scale-button[active] {
      background: var(--affine-hover-color);
    }

    .scale-button-label {
      text-align: justify;
      font-style: normal;
      width: 48px;
      height: 24px;
      font-weight: 400;
      line-height: 24px;
      color: var(--affine-icon-color);
      padding: 0 8px;
      border-radius: 4px;
    }

    menu-divider {
      width: 100%;
    }
  `;

  @property({ attribute: false })
  scale!: number;

  @property({ attribute: false })
  scales!: number[];

  @property({ attribute: false })
  onSelect?: (size: EdgelessScalePanel['scale']) => void;

  @property({ attribute: false })
  onPopperCose?: () => void;

  @property({ attribute: false })
  minScale: number = MIN_SCALE;

  @property({ attribute: false })
  maxScale: number = MAX_SCALE;

  private _onSelect(scale: EdgelessScalePanel['scale']) {
    if (this.onSelect) this.onSelect(scale / 100);
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

      let size = parseInt(input.value);
      // Handle edge case when user enters a number that is out of range
      if (size < this.minScale) {
        size = this.minScale;
      } else if (size > this.maxScale) {
        size = this.maxScale;
      }

      this._onSelect(size);
      input.value = '';
      this._onPopperClose();
    }
  };

  override render() {
    return html`
      <div class="scale-container">
        <div
          class="scale-input-container"
          @click=${(e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <input
            class="scale-input"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            placeholder=${Math.trunc(this.scale) + '%'}
            @keydown=${this._onKeydown}
            @input=${stopPropagation}
            @pointerdown=${stopPropagation}
          />
        </div>
        <div class="scale-content">
          ${repeat(
            this.scales,
            scale => scale,
            scale =>
              html` <div
                class="scale-button"
                role="button"
                ?active=${this.scale === scale}
                @click=${() => {
                  this._onSelect(scale);
                }}
              >
                <div class="scale-button-label">${scale + '%'}</div>
              </div>`
          )}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-scale-panel': EdgelessScalePanel;
  }
}

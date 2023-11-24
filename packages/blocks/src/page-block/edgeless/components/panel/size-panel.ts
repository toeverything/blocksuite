import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { stopPropagation } from '../../../../_common/utils/event.js';

const MIN_SIZE = 1;
const MAX_SIZE = 200;
@customElement('edgeless-size-panel')
export class EdgelessSizePanel extends LitElement {
  static override styles = css`
    :host {
      box-shadow: var(--affine-menu-shadow);
    }

    .size-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px 8px;
      background: var(--affine-background-overlay-panel-color);
      border-radius: 8px;
    }

    .size-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 64px;
    }

    .size-button {
      display: flex;
      align-items: center;
      justify-content: start;
      width: 64px;
      height: 32px;
      padding: 0 8px;
    }

    .size-button[active] .size-button-label {
      background: var(--affine-hover-color);
    }

    .size-button-label {
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

    .size-button-label:hover {
      cursor: pointer;
      background: var(--affine-hover-color);
    }

    .size-input-container {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .size-input {
      width: 48px;
      height: 18px;
      border: 1px solid var(--affine-border-color);
      border-radius: 8px;
      padding: 4px 8px;
    }

    .size-input::placeholder {
      color: var(--affine-placeholder-color);
    }

    .size-input:focus {
      outline-color: var(--affine-primary-color);
    }

    menu-divider {
      width: 100%;
    }
  `;

  @property({ attribute: false })
  size!: number;

  @property({ attribute: false })
  sizes!: number[];

  @property({ attribute: false })
  labels = ['Small', 'Medium', 'Large', 'Huge'];

  @property({ attribute: false })
  onSelect?: (size: EdgelessSizePanel['size']) => void;

  @property({ attribute: false })
  onPopperCose?: () => void;

  @property({ attribute: false })
  minSize: number = MIN_SIZE;

  @property({ attribute: false })
  maxSize: number = MAX_SIZE;

  private _onSelect(size: EdgelessSizePanel['size']) {
    if (this.onSelect) this.onSelect(size);
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
      if (size < this.minSize) {
        size = this.minSize;
      } else if (size > this.maxSize) {
        size = this.maxSize;
      }

      this._onSelect(size);
      input.value = '';
      this._onPopperClose();
    }
  };

  override render() {
    return html`
      <div class="size-container">
        <div class="size-content">
          ${repeat(
            this.sizes,
            size => size,
            (size, index) =>
              html` <div
                class="size-button"
                role="button"
                ?active=${this.size === size}
                @click=${() => {
                  this._onSelect(size);
                }}
              >
                <div class="size-button-label">${this.labels[index]}</div>
              </div>`
          )}

          <div
            class="size-input-container"
            @click=${(e: MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <input
              class="size-input"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              placeholder=${Math.trunc(this.size)}
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
    'edgeless-size-panel': EdgelessSizePanel;
  }
}

import '../buttons/tool-icon-button.js';

import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { stopPropagation } from '../../../../_common/utils/event.js';

const MIN_SCALE = 1;
const MAX_SCALE = 400;

@customElement('edgeless-scale-panel')
export class EdgelessScalePanel extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      width: 68px;
    }

    edgeless-tool-icon-button {
      align-self: stretch;
    }

    .scale-input {
      display: flx;
      align-self: stretch;
      border: 0.5px solid var(--affine-border-color);
      border-radius: 8px;
      padding: 4px 8px;
      box-sizing: border-box;
    }

    .scale-input::placeholder {
      color: var(--affine-placeholder-color);
    }

    .scale-input:focus {
      outline-color: var(--affine-primary-color);
      outline-width: 0.5px;
    }
  `;

  @property({ attribute: false })
  accessor scale!: number;

  @property({ attribute: false })
  accessor scales!: number[];

  @property({ attribute: false })
  accessor onSelect: ((size: EdgelessScalePanel['scale']) => void) | undefined =
    undefined;

  @property({ attribute: false })
  accessor onPopperCose: (() => void) | undefined = undefined;

  @property({ attribute: false })
  accessor minScale: number = MIN_SCALE;

  @property({ attribute: false })
  accessor maxScale: number = MAX_SCALE;

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
      ${repeat(
        this.scales,
        scale => scale,
        scale =>
          html`<edgeless-tool-icon-button
            .iconContainerPadding=${[4, 8]}
            .activeMode=${'background'}
            .active=${this.scale === scale}
            @click=${() => this._onSelect(scale)}
          >
            ${scale + '%'}
          </edgeless-tool-icon-button>`
      )}

      <input
        class="scale-input"
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        min="0"
        placeholder=${Math.trunc(this.scale) + '%'}
        @keydown=${this._onKeydown}
        @input=${stopPropagation}
        @click=${stopPropagation}
        @pointerdown=${stopPropagation}
      />
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-scale-panel': EdgelessScalePanel;
  }
}

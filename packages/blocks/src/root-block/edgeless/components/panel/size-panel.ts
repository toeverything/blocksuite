import '../buttons/tool-icon-button.js';

import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { CheckIcon } from '../../../../_common/icons/edgeless.js';
import { stopPropagation } from '../../../../_common/utils/event.js';

const MIN_SIZE = 1;
const MAX_SIZE = 200;

@customElement('edgeless-size-panel')
export class EdgelessSizePanel extends LitElement {
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

    .size-input {
      display: flex;
      align-self: stretch;
      width: 100%;
      border: 0.5px solid var(--affine-border-color);
      border-radius: 8px;
      padding: 4px 8px;
      box-sizing: border-box;
    }

    .size-input::placeholder {
      color: var(--affine-placeholder-color);
    }

    .size-input:focus {
      outline-color: var(--affine-primary-color);
      outline-width: 0.5px;
    }

    :host([data-type='check']) {
      gap: 0;
    }

    :host([data-type='check']) .size-input {
      margin-top: 4px;
    }
  `;

  @property({ attribute: false })
  accessor size!: number;

  @property({ attribute: false })
  accessor sizes!: number[];

  @property({ attribute: false })
  accessor labels = ['Small', 'Medium', 'Large', 'Huge'];

  @property({ attribute: false })
  accessor onSelect: ((size: number) => void) | undefined = undefined;

  @property({ attribute: false })
  accessor onPopperCose: (() => void) | undefined = undefined;

  @property({ attribute: false })
  accessor minSize: number = MIN_SIZE;

  @property({ attribute: false })
  accessor maxSize: number = MAX_SIZE;

  @property({ attribute: 'data-type' })
  accessor type: 'normal' | 'check' = 'normal';

  private _onSelect(size: number) {
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

  renderItem() {
    return this.type === 'normal'
      ? this.renderItemWithNormal
      : this.renderItemWithCheck;
  }

  renderItemWithNormal = (size: number, index: number) => {
    const active = this.size === size;
    return html`<edgeless-tool-icon-button
      .iconContainerPadding=${[4, 8]}
      .active=${active}
      .activeMode=${'background'}
      @click=${() => this._onSelect(size)}
    >
      ${this.labels[index]}
    </edgeless-tool-icon-button>`;
  };

  renderItemWithCheck = (size: number, index: number) => {
    const active = this.size === size;
    return html`
      <edgeless-tool-icon-button
        .iconContainerPadding=${[4, 8]}
        .justify=${'space-between'}
        .active=${active}
        @click=${() => this._onSelect(size)}
      >
        ${this.labels[index]} ${active ? CheckIcon : nothing}
      </edgeless-tool-icon-button>
    `;
  };

  override render() {
    return html`
      ${repeat(this.sizes, size => size, this.renderItem())}

      <input
        class="size-input"
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        min="0"
        placeholder=${Math.trunc(this.size)}
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
    'edgeless-size-panel': EdgelessSizePanel;
  }
}

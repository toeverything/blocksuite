import { CheckIcon } from '@blocksuite/affine-components/icons';
import { clamp, stopPropagation } from '@blocksuite/affine-shared/utils';
import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

const MIN_SIZE = 1;
const MAX_SIZE = 200;

type SizeItem = {
  name?: string;
  value: number;
};

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

  private _onKeydown = (e: KeyboardEvent) => {
    e.stopPropagation();

    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      const input = e.target as HTMLInputElement;
      const size = parseInt(input.value.trim());
      // Handle edge case where user enters a non-number
      if (isNaN(size)) {
        input.value = '';
        return;
      }

      // Handle edge case when user enters a number that is out of range
      this._onSelect(clamp(size, this.minSize, this.maxSize));
      input.value = '';
      this._onPopperClose();
    }
  };

  renderItemWithCheck = ({ name, value }: SizeItem) => {
    const active = this.size === value;
    return html`
      <edgeless-tool-icon-button
        .iconContainerPadding=${[4, 8]}
        .justify=${'space-between'}
        .active=${active}
        @click=${() => this._onSelect(value)}
      >
        ${name ?? value} ${active ? CheckIcon : nothing}
      </edgeless-tool-icon-button>
    `;
  };

  renderItemWithNormal = ({ name, value }: SizeItem) => {
    return html`
      <edgeless-tool-icon-button
        .iconContainerPadding=${[4, 8]}
        .active=${this.size === value}
        .activeMode=${'background'}
        @click=${() => this._onSelect(value)}
      >
        ${name ?? value}
      </edgeless-tool-icon-button>
    `;
  };

  private _onPopperClose() {
    this.onPopperCose?.();
  }

  private _onSelect(size: number) {
    this.onSelect?.(size);
  }

  override render() {
    return html`
      ${repeat(this.sizeList, sizeItem => sizeItem.name, this.renderItem())}

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
        @cut=${stopPropagation}
        @copy=${stopPropagation}
        @paste=${stopPropagation}
      />
    `;
  }

  renderItem() {
    return this.type === 'normal'
      ? this.renderItemWithNormal
      : this.renderItemWithCheck;
  }

  @property({ attribute: false })
  accessor maxSize: number = MAX_SIZE;

  @property({ attribute: false })
  accessor minSize: number = MIN_SIZE;

  @property({ attribute: false })
  accessor onPopperCose: (() => void) | undefined = undefined;

  @property({ attribute: false })
  accessor onSelect: ((size: number) => void) | undefined = undefined;

  @property({ attribute: false })
  accessor size!: number;

  @property({ attribute: false })
  accessor sizeList!: SizeItem[];

  @property({ attribute: 'data-type' })
  accessor type: 'normal' | 'check' = 'normal';
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-size-panel': EdgelessSizePanel;
  }
}

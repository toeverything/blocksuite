import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { AIStarIcon } from '../../../../../_common/icons/ai.js';
import { ArrowUpBigIcon } from '../../../../../_common/icons/text.js';
import { stopPropagation } from '../../../../../_common/utils/event.js';

@customElement('ai-panel-input')
export class AIPanelInput extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      width: 100%;
      padding: 0 12px;
      box-sizing: border-box;
    }

    .root {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: var(--affine-background-overlay-panel-color);
    }

    .icon {
      display: flex;
      align-items: center;
    }

    .textarea-container {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      flex: 1 0 0;

      textarea {
        flex: 1 0 0;
        border: none;
        outline: none;
        -webkit-box-shadow: none;
        -moz-box-shadow: none;
        box-shadow: none;
        background-color: transparent;
        resize: none;
        overflow: hidden;
        padding: 0px;

        color: var(--affine-text-primary-color);

        /* light/sm */
        font-family: var(--affine-font-family);
        font-size: var(--affine-font-sm);
        font-style: normal;
        font-weight: 400;
        line-height: 22px; /* 157.143% */
      }

      textarea::placeholder {
        color: var(--affine-placeholder-color);
      }

      textarea::-moz-placeholder {
        color: var(--affine-placeholder-color);
      }
    }

    .arrow {
      display: flex;
      align-items: center;
      padding: 2px;
      gap: 10px;
      border-radius: 4px;
      background: var(--affine-black-10, rgba(0, 0, 0, 0.1));

      svg {
        width: 16px;
        height: 16px;
        color: var(--affine-pure-white, #fff);
      }
    }
    .arrow[data-active] {
      background: var(--affine-brand-color, #1e96eb);
    }
    .arrow[data-active]:hover {
      cursor: pointer;
    }
  `;

  @property({ attribute: false })
  onFinish?: (input: string) => void;

  @query('.arrow')
  private _arrow!: HTMLDivElement;

  @query('textarea')
  private _textarea!: HTMLTextAreaElement;

  @state()
  private _hasContent = false;

  private _sendToAI = () => {
    if (this._textarea.value.length === 0) return;

    this.onFinish?.(this._textarea.value);
    this.remove();
  };

  private _onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      this._sendToAI();
    }
  };

  private _onInput = () => {
    this._textarea.style.height = 'auto';
    this._textarea.style.height = this._textarea.scrollHeight + 'px';

    if (this._textarea.value.length > 0) {
      this._arrow.dataset.active = '';
      this._hasContent = true;
    } else {
      delete this._arrow.dataset.active;
      this._hasContent = false;
    }
  };

  override updated(_changedProperties: Map<PropertyKey, unknown>): void {
    const result = super.updated(_changedProperties);
    this._textarea.style.height = this._textarea.scrollHeight + 'px';
    return result;
  }

  override render() {
    this.updateComplete
      .then(() => {
        requestAnimationFrame(() => {
          this._textarea.focus();
        });
      })
      .catch(console.error);

    return html`<div class="root">
      <div class="icon">${AIStarIcon}</div>
      <div class="textarea-container">
        <textarea
          placeholder="Ask AI to edit or generate..."
          rows="1"
          @keydown=${this._onKeyDown}
          @input=${this._onInput}
          @pointerdown=${stopPropagation}
          @click=${stopPropagation}
          @dblclick=${stopPropagation}
          @cut=${stopPropagation}
          @copy=${stopPropagation}
          @paste=${stopPropagation}
          @keyup=${stopPropagation}
        ></textarea>
        <div
          class="arrow"
          @click=${this._sendToAI}
          @pointerdown=${stopPropagation}
        >
          ${ArrowUpBigIcon}
          ${this._hasContent
            ? html`<affine-tooltip .offset=${12}>Send to AI</affine-tooltip>`
            : nothing}
        </div>
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-panel-input': AIPanelInput;
  }
}

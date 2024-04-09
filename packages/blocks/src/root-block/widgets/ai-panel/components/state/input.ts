import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { AIStarIcon } from '../../../../../_common/icons/ai.js';
import { ArrowUpBigIcon } from '../../../../../_common/icons/text.js';

@customElement('ai-panel-input')
export class AIPanelInput extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      width: 100%;
      padding: 8px 12px;
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
      background: var(--light-black-black10, rgba(0, 0, 0, 0.1));

      svg {
        width: 16px;
        height: 16px;
        color: var(--light-pure-white, #fff);
      }
    }
    .arrow[data-active] {
      background: var(--light-brandColor, #1e96eb);
    }
  `;

  @property({ attribute: false })
  onFinish?: (input: string) => void;

  @query('.arrow')
  private _arrow!: HTMLDivElement;

  @query('textarea')
  private _textarea!: HTMLTextAreaElement;

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
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              this.onFinish?.(this._textarea.value);
              this.remove();
            }
          }}
          @input=${() => {
            this._textarea.style.height = 'auto';
            this._textarea.style.height = this._textarea.scrollHeight + 'px';

            if (this._textarea.value.length > 0) {
              this._arrow.dataset.active = '';
            }
          }}
        ></textarea>
        <div class="arrow">${ArrowUpBigIcon}</div>
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-panel-input': AIPanelInput;
  }
}

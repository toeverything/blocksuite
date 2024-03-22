import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { AIStarIcon } from '../../../../_common/icons/ai.js';
import { ArrowUpBigIcon } from '../../../../_common/icons/arrow.js';

@customElement('ai-action-bar-input')
export class AIActionBarInput extends WithDisposable(LitElement) {
  static override styles = css`
    .root {
      display: flex;
      padding: 8px 12px;
      align-items: center;
      gap: 8px;

      border-radius: var(--8, 8px);
      border: 1px solid var(--light-detailColor-borderColor, #e3e2e4);
      background: var(--light-background-backgroundOverlayPanelColor, #fbfbfc);

      /* light/toolbarShadow */
      box-shadow: 0px 6px 16px 0px rgba(0, 0, 0, 0.14);
    }

    .icon {
      display: flex;
      width: 20px;
      height: 20px;
      justify-content: center;
      align-items: center;
      flex-shrink: 0;
    }

    .textarea-container {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1 0 0;
    }

    textarea {
      flex: 1 0 0;

      height: 22px;
      overflow: hidden;

      border: none;
      outline: none;
      -webkit-box-shadow: none;
      -moz-box-shadow: none;
      box-shadow: none;
      resize: none;

      background-color: transparent;

      color: var(--light-textColor-textPrimaryColor, #121212);

      /* light/sm */
      font-family: Inter;
      font-size: 14px;
      font-style: normal;
      font-weight: 400;
      line-height: 22px; /* 157.143% */
    }
    textarea::placeholder {
      color: var(--light-detailColor-placeholderColor, #c0bfc1);
    }

    .arrow {
      display: flex;
      padding: 2px;
      align-items: center;
      gap: 10px;

      border-radius: 4px;
      background: var(--light-black-black10, rgba(0, 0, 0, 0.1));
    }
    .arrow[data-active] {
      background: var(--light-brandColor, #1e96eb);
    }
  `;

  @property({ attribute: false })
  onFinish?: (input: string) => void;

  @query('textarea')
  private _textarea!: HTMLTextAreaElement;

  @query('.arrow')
  private _arrow!: HTMLDivElement;

  private _onInput = () => {
    if (this._textarea.scrollHeight > this._textarea.clientHeight) {
      this._textarea.style.height = this._textarea.scrollHeight + 'px';
    }

    if (this._textarea.value.length > 0) {
      this._arrow.dataset.active = '';
    } else {
      delete this._arrow.dataset.active;
    }
  };

  override render() {
    return html`<div class="root">
      <div class="icon">${AIStarIcon}</div>
      <div class="textarea-container">
        <textarea
          spellcheck="false"
          placeholder="Ask AI to edit or generate..."
          @input=${this._onInput}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              this.onFinish?.(this._textarea.value);
              this.remove();
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
    'ai-action-bar-input': AIActionBarInput;
  }
}

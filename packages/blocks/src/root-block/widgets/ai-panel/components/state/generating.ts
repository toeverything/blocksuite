import { WithDisposable } from '@blocksuite/block-std';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  AIStarIconWithAnimation,
  AIStopIcon,
} from '../../../../../_common/icons/ai.js';

@customElement('ai-panel-generating')
export class AIPanelGenerating extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      width: 100%;
      padding: 8px 12px;
      box-sizing: border-box;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    }

    .generating-tip {
      display: flex;
      width: 100%;
      height: 22px;
      align-items: center;
      gap: 8px;

      color: var(--light-brandColor, #1e96eb);

      .text {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        flex: 1 0 0;

        /* light/smMedium */
        font-size: var(--affine-font-sm);
        font-style: normal;
        font-weight: 500;
        line-height: 22px; /* 157.143% */
      }

      .left,
      .right {
        display: flex;
        width: 20px;
        height: 20px;
        justify-content: center;
        align-items: center;
      }
    }
  `;

  @property({ attribute: false })
  stopGenerating!: () => void;

  override render() {
    return html`
      <div class="generating-tip">
        <div class="left">${AIStarIconWithAnimation}</div>
        <div class="text">AI is generating...</div>
        <div @click=${this.stopGenerating} class="right">${AIStopIcon}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-panel-generating': AIPanelGenerating;
  }
}

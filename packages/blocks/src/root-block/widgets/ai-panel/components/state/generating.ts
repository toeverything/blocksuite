import '../generating-placeholder.js';

import { WithDisposable } from '@blocksuite/block-std';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  AIStarIconWithAnimation,
  AIStopIcon,
} from '../../../../../_common/icons/ai.js';
import type { AIPanelGeneratingConfig } from '../../type.js';

@customElement('ai-panel-generating')
export class AIPanelGenerating extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      width: 100%;
      padding: 0 12px;
      box-sizing: border-box;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    }

    .generating-tip {
      display: flex;
      width: 100%;
      height: 22px;
      align-items: center;
      gap: 8px;

      color: var(--affine-brand-color);

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
        height: 20px;
        justify-content: center;
        align-items: center;
      }
      .left {
        width: 20px;
      }
      .right {
        gap: 6px;
      }
      .right:hover {
        cursor: pointer;
      }
      .stop-icon {
        height: 20px;
        width: 20px;
      }
      .esc-label {
        font-size: var(--affine-font-xs);
        font-weight: 500;
        line-height: 20px;
      }
    }
  `;

  @property({ attribute: false })
  accessor config!: AIPanelGeneratingConfig;

  @property({ attribute: false })
  accessor loadingProgress: number = 1;

  @property({ attribute: false })
  accessor withAnswer!: boolean;

  @property({ attribute: false })
  accessor stopGenerating!: () => void;

  updateLoadingProgress(progress: number) {
    this.loadingProgress = progress;
  }

  override render() {
    const {
      generatingIcon = AIStarIconWithAnimation,
      stages,
      height = 300,
    } = this.config;
    return html`
      ${stages && stages.length > 0
        ? html`<generating-placeholder
            .height=${height}
            .loadingProgress=${this.loadingProgress}
            .stages=${stages}
            .showHeader=${!this.withAnswer}
          ></generating-placeholder>`
        : nothing}
      <div class="generating-tip">
        <div class="left">${generatingIcon}</div>
        <div class="text">AI is generating...</div>
        <div @click=${this.stopGenerating} class="right">
          <span class="stop-icon">${AIStopIcon}</span>
          <span class="esc-label">ESC</span>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-panel-generating': AIPanelGenerating;
  }
}

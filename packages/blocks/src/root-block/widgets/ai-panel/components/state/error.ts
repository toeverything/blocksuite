import { WithDisposable } from '@blocksuite/block-std';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type {
  AIItemConfig,
  AIItemGroupConfig,
} from '../../../../../_common/components/index.js';

export interface AIPanelErrorConfig {
  upgrade: () => void;
  responses: AIItemConfig[];
}

@customElement('ai-panel-error')
export class AIPanelError extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px 0px;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    }

    .error {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      gap: 8px;
      align-self: stretch;
      padding: 0px 12px;
      .answer-tip {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        gap: 4px;
        align-self: stretch;
        .top {
          align-self: stretch;
          color: var(--affine-text-secondary-color);
          /* light/xsMedium */
          font-size: var(--affine-font-xs);
          font-style: normal;
          font-weight: 500;
          line-height: 20px; /* 166.667% */
        }
        .bottom {
          align-self: stretch;
          color: var(--affine-error-color, #eb4335);
          font-feature-settings:
            'clig' off,
            'liga' off;
          /* light/sm */
          font-size: var(--affine-font-sm);
          font-style: normal;
          font-weight: 400;
          line-height: 22px; /* 157.143% */
        }
      }
      .upgrade {
        display: flex;
        padding: 4px 12px;
        justify-content: center;
        align-items: center;
        gap: 4px;
        border-radius: 8px;
        border: 1px solid var(--affine-border-color, #e3e2e4);
        background: var(--light-white-white, #fff);
        .content {
          display: flex;
          padding: 0px 4px;
          justify-content: center;
          align-items: center;
          color: var(--affine-text-primary-color, #121212);
          /* light/xsMedium */
          font-size: var(--affine-font-xs);
          font-style: normal;
          font-weight: 500;
          line-height: 20px; /* 166.667% */
        }
      }
      .upgrade:hover {
        background: var(--affine-hover-color, rgba(0, 0, 0, 0.04));
      }
    }
  `;

  @property({ attribute: false })
  config!: AIPanelErrorConfig;

  override render() {
    const groups: AIItemGroupConfig[] = [{ items: this.config.responses }];

    return html`
      <div class="error">
        <div class="answer-tip">
          <div class="top">Answer</div>
          <div class="bottom">
            An error occurred, If this issue persists please contact us through
            our help center at help.openai.com
          </div>
        </div>
        <div @click=${this.config.upgrade} class="upgrade">
          <div class="content">Upgrade</div>
        </div>
      </div>
      ${this.config.responses.length > 0
        ? html`<ai-item-list .groups=${groups}></ai-item-list>`
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-panel-error': AIPanelError;
  }
}

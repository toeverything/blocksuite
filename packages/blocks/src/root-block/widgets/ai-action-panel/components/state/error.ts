import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type {
  AIActionPanelListGroup,
  AIActionPanelListGroupItem,
} from '../item.js';

export interface AIActionPanelErrorConfig {
  upgrade: () => void;
  responses: AIActionPanelListGroupItem[];
}

@customElement('ai-action-panel-error')
export class AIActionPanelError extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .error {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      gap: 8px;
      align-self: stretch;
      .answer-tip {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        gap: 4px;
        align-self: stretch;
        .top {
          align-self: stretch;
          color: var(
            --light-textColor-textSecondaryColor,
            var(--textColor-textSecondaryColor, #8e8d91)
          );
          /* light/xsMedium */
          font-family: Inter;
          font-size: 12px;
          font-style: normal;
          font-weight: 500;
          line-height: 20px; /* 166.667% */
        }
        .bottom {
          align-self: stretch;
          color: var(--light-detailColor-statusColor-errorColor, #eb4335);
          font-feature-settings:
            'clig' off,
            'liga' off;
          /* light/sm */
          font-family: Inter;
          font-size: 14px;
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
        border: 1px solid var(--light-detailColor-borderColor, #e3e2e4);
        background: var(--light-white-white, #fff);
        .content {
          display: flex;
          padding: 0px 4px;
          justify-content: center;
          align-items: center;
          color: var(--light-textColor-textPrimaryColor, #121212);
          /* light/xsMedium */
          font-family: Inter;
          font-size: 12px;
          font-style: normal;
          font-weight: 500;
          line-height: 20px; /* 166.667% */
        }
      }
      .upgrade:hover {
        background: var(--light-detailColor-hoverColor, rgba(0, 0, 0, 0.04));
      }
    }
  `;

  @property({ attribute: false })
  config!: AIActionPanelErrorConfig;

  override render() {
    const groups: AIActionPanelListGroup[] = [{ items: this.config.responses }];

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
        ? html`<ai-action-panel-list .groups=${groups}></ai-action-panel-list>`
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-action-panel-error': AIActionPanelError;
  }
}

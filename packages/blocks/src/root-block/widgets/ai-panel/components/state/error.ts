import '../finish-tip.js';

import { WithDisposable } from '@blocksuite/block-std';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';

import { AIErrorType } from '../../../../../_common/components/index.js';
import type { AIPanelErrorConfig, CopyConfig } from '../../type.js';

@customElement('ai-panel-error')
export class AIPanelError extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 0;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    }

    .error {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
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

          a {
            color: inherit;
          }
        }
      }
      .action-button {
        display: flex;
        padding: 4px 12px;
        justify-content: center;
        align-items: center;
        gap: 4px;
        border-radius: 8px;
        border: 1px solid var(--affine-border-color, #e3e2e4);
        background: var(--affine-white, #fff);
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
      .action-button:hover {
        background: var(--affine-hover-color, rgba(0, 0, 0, 0.04));
      }
    }

    ai-panel-divider {
      margin-top: 4px;
    }

    .response-list-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 0 8px;
      user-select: none;
    }

    .response-list-container ai-item-list {
      --item-padding: 4px;
      --item-icon-color: var(--affine-icon-secondary);
      --item-icon-hover-color: var(--affine-icon-color);
    }
  `;

  @property({ attribute: false })
  config!: AIPanelErrorConfig;

  @property({ attribute: false })
  copy?: CopyConfig;

  @property({ attribute: false })
  showTip = false;

  override render() {
    const errorTemplate = choose(
      this.config.error?.type,
      [
        [
          AIErrorType.Unauthorized,
          () =>
            html` <div class="bottom">
                You need to login to AFFiNE Cloud to continue using AFFiNE AI.
              </div>
              <div @click=${this.config.login} class="action-button">
                <div class="content">Login</div>
              </div>`,
        ],
        [
          AIErrorType.PaymentRequired,
          () => html`
            <div class="bottom">
              You've reached the current usage cap for AFFiNE AI. You can
              subscribe to AFFiNE AI to continue the AI experience!
            </div>
            <div @click=${this.config.upgrade} class="action-button">
              <div class="content">Upgrade</div>
            </div>
          `,
        ],
      ],
      // default error handler
      () => html`
        <div class="bottom">
          An error occurred. Please try again later. If this issue persists,
          please let us know at
          <a href="mailto:support@toeverything.info">
            support@toeverything.info
          </a>
        </div>
      `
    );

    return html`
      <div class="error">
        <div class="answer-tip">
          <div class="top">Answer</div>
          <slot></slot>
          ${errorTemplate}
        </div>
      </div>
      ${this.showTip
        ? html`<ai-finish-tip .copy=${this.copy}></ai-finish-tip>`
        : nothing}
      ${this.config.responses.length > 0
        ? html`
            <ai-panel-divider></ai-panel-divider>
            ${this.config.responses.map(
              (group, index) => html`
                ${index !== 0
                  ? html`<ai-panel-divider></ai-panel-divider>`
                  : nothing}
                <div class="response-list-container">
                  <ai-item-list .groups=${[group]}></ai-item-list>
                </div>
              `
            )}
          `
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-panel-error': AIPanelError;
  }
}

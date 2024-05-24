import '../finish-tip.js';

import type { EditorHost } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';

import {
  AIErrorType,
  type AIItemGroupConfig,
} from '../../../../../_common/components/index.js';
import type { AIPanelErrorConfig, CopyConfig } from '../../type.js';
import { filterAIItemGroup } from '../../utils.js';

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
      gap: 4px;
      .answer-tip {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        gap: 4px;
        align-self: stretch;
        .answer-label {
          align-self: stretch;
          color: var(--affine-text-secondary-color);
          /* light/xsMedium */
          font-size: var(--affine-font-xs);
          font-style: normal;
          font-weight: 500;
          line-height: 20px; /* 166.667% */
        }
      }
      .error-info {
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
      .action-button-group {
        display: flex;
        width: 100%;
        gap: 16px;
        align-items: center;
        justify-content: end;
        margin-top: 4px;
      }
      .action-button {
        display: flex;
        box-sizing: border-box;
        padding: 4px 12px;
        justify-content: center;
        align-items: center;
        gap: 4px;
        border-radius: 8px;
        border: 1px solid var(--affine-border-color);
        background: var(--affine-white);
        color: var(--affine-text-primary-color);
        /* light/xsMedium */
        font-size: var(--affine-font-xs);
        font-style: normal;
        font-weight: 500;
        line-height: 20px; /* 166.667% */
      }
      .action-button:hover {
        cursor: pointer;
      }
      .action-button.primary {
        border: 1px solid var(--affine-black-10);
        background: var(--affine-primary-color);
        color: var(--affine-pure-white);
      }
      .action-button > span {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
      }
      .action-button:not(.primary):hover {
        background: var(--affine-hover-color);
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
  accessor config!: AIPanelErrorConfig;

  @property({ attribute: false })
  accessor copy: CopyConfig | undefined = undefined;

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor withAnswer = false;

  private _getResponseGroup = () => {
    let responseGroup: AIItemGroupConfig[] = [];
    const errorType = this.config.error?.type;
    if (errorType && errorType !== AIErrorType.GeneralNetworkError) {
      return responseGroup;
    }

    responseGroup = filterAIItemGroup(this.host, this.config.responses);

    return responseGroup;
  };

  override render() {
    const responseGroup = this._getResponseGroup();
    const errorTemplate = choose(
      this.config.error?.type,
      [
        [
          AIErrorType.Unauthorized,
          () =>
            html` <div class="error-info">
                You need to login to AFFiNE Cloud to continue using AFFiNE AI.
              </div>
              <div class="action-button-group">
                <div @click=${this.config.cancel} class="action-button">
                  <span>Cancel</span>
                </div>
                <div @click=${this.config.login} class="action-button primary">
                  <span>login</span>
                </div>
              </div>`,
        ],
        [
          AIErrorType.PaymentRequired,
          () =>
            html` <div class="error-info">
                You've reached the current usage cap for AFFiNE AI. You can
                subscribe to AFFiNE AI to continue the AI experience!
              </div>
              <div class="action-button-group">
                <div @click=${this.config.cancel} class="action-button">
                  <span>Cancel</span>
                </div>
                <div
                  @click=${this.config.upgrade}
                  class="action-button primary"
                >
                  <span>Upgrade</span>
                </div>
              </div>`,
        ],
      ],
      // default error handler
      () => html`
        <div class="error-info">
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
          <div class="answer-label">Answer</div>
          <slot></slot>
        </div>
        ${errorTemplate}
      </div>
      ${this.withAnswer
        ? html`<ai-finish-tip .copy=${this.copy}></ai-finish-tip>`
        : nothing}
      ${responseGroup.length > 0
        ? html`
            <ai-panel-divider></ai-panel-divider>
            ${responseGroup.map(
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

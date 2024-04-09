import { WithDisposable } from '@blocksuite/block-std';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type {
  AIItemConfig,
  AIItemGroupConfig,
} from '../../../../../_common/components/ai-item/index.js';
import { WarningIcon } from '../../../../../_common/icons/misc.js';
import { CopyIcon } from '../../../../../_common/icons/text.js';

export type AIPanelAnswerConfig = {
  responses: AIItemConfig[];
  actions: AIItemGroupConfig[];
};

@customElement('ai-panel-answer')
export class AIPanelAnswer extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px 0px;
    }

    .answer {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      gap: 4px;
      align-self: stretch;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      padding: 0 12px;
    }

    .answer-head {
      align-self: stretch;

      color: var(--affine-text-secondary-color);

      /* light/xsMedium */
      font-size: var(--affine-font-xs);
      font-style: normal;
      font-weight: 500;
      line-height: 20px; /* 166.667% */
    }

    .answer-body {
      align-self: stretch;

      color: var(--affine-text-primary-color);
      font-feature-settings:
        'clig' off,
        'liga' off;

      /* light/sm */
      font-size: var(--affine-font-xs);
      font-style: normal;
      font-weight: 400;
      line-height: 22px; /* 157.143% */
    }

    .finish-tip {
      display: flex;
      box-sizing: border-box;
      width: 100%;
      height: 22px;
      align-items: center;
      gap: 8px;
      padding: 0 12px;

      color: var(--affine-text-secondary-color);

      .text {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        flex: 1 0 0;

        /* light/xs */
        font-size: var(--affine-font-xs);
        font-style: normal;
        font-weight: 400;
        line-height: 20px; /* 166.667% */
      }

      .right {
        display: flex;
        align-items: center;
        gap: 16px;

        .copy {
          display: flex;
          width: 20px;
          height: 20px;
          justify-content: center;
          align-items: center;

          border-radius: 8px;

          &:hover {
            background: var(--affine-hover-color);
          }
        }
      }
    }

    .response-list-container ai-item-list {
      /* set item icon color outside ai-item */
      --item-icon-color: var(--affine-icon-secondary);
      --item-icon-hover-color: var(--affine-icon-color);
    }
  `;

  @property({ attribute: false })
  config!: AIPanelAnswerConfig;

  @property({ attribute: false })
  finish = true;

  override render() {
    const responseGroups: AIItemGroupConfig[] = [
      {
        name: 'Response',
        items: this.config.responses,
      },
    ];

    return html`
      <div class="answer">
        <div class="answer-head">Answer</div>
        <div class="answer-body">
          <slot></slot>
        </div>
      </div>
      ${this.finish
        ? html`
            <div class="finish-tip">
              ${WarningIcon}
              <div class="text">AI outputs can be misleading or wrong</div>
              <div class="right">
                <div class="copy">${CopyIcon}</div>
              </div>
            </div>
            ${this.config.responses.length > 0
              ? html`
                  <ai-panel-divider></ai-panel-divider>
                  <div class="response-list-container">
                    <ai-item-list .groups=${responseGroups}></ai-item-list>
                  </div>
                `
              : nothing}
            ${this.config.responses.length > 0 && this.config.actions.length > 0
              ? html`<ai-panel-divider></ai-panel-divider>`
              : nothing}
            ${this.config.actions.length > 0
              ? html`
                  <div class="action-list-container">
                    <ai-item-list .groups=${this.config.actions}></ai-item-list>
                  </div>
                `
              : nothing}
          `
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-panel-answer': AIPanelAnswer;
  }
}

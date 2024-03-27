import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { WarningIcon } from '../../../../../_common/icons/misc.js';
import { CopyIcon } from '../../../../../_common/icons/text.js';
import type {
  AIActionPanelListGroup,
  AIActionPanelListGroupItem,
} from '../item.js';

export type AIActionPanelAnswerConfig = {
  responses: AIActionPanelListGroupItem[];
  //TODO: ai actions
  // actions: AIActionPanelListGroup[];
};

@customElement('ai-action-panel-answer')
export class AIActionPanelAnswer extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .answer {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      gap: 4px;
      align-self: stretch;
    }

    .answer-head {
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

    .answer-body {
      align-self: stretch;

      color: var(--light-textColor-textPrimaryColor, #121212);
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

    .finish-tip {
      display: flex;
      width: 100%;
      height: 22px;
      align-items: center;
      gap: 8px;

      color: var(
        --light-textColor-textSecondaryColor,
        var(--textColor-textSecondaryColor, #8e8d91)
      );

      .text {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        flex: 1 0 0;

        /* light/xs */
        font-family: Inter;
        font-size: 12px;
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
            background: var(
              --light-detailColor-hoverColor,
              rgba(0, 0, 0, 0.04)
            );
          }
        }
      }
    }
  `;

  @property({ attribute: false })
  config!: AIActionPanelAnswerConfig;

  @property({ attribute: false })
  finish = true;

  override render() {
    const groups: AIActionPanelListGroup[] = [
      {
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
                  <ai-action-panel-divider></ai-action-panel-divider>
                  <ai-action-panel-list
                    .groups=${groups}
                  ></ai-action-panel-list>
                `
              : nothing}
          `
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-action-panel-answer': AIActionPanelAnswer;
  }
}

import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { WarningIcon } from '../../../../../icons/misc.js';
import { CopyIcon } from '../../../../../icons/text.js';

@customElement('ai-text-answer')
export class AITextAnswer extends WithDisposable(LitElement) {
  static override styles = css`
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
  text = '';

  override render() {
    return html`
      <div class="answer">
        <div class="answer-head">Answer</div>
        <div class="answer-body">${this.text}</div>
      </div>
      <div class="finish-tip">
        ${WarningIcon}
        <div class="text">AI outputs can be misleading or wrong</div>
        <div class="right">
          <div class="copy">${CopyIcon}</div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-text-answer': AITextAnswer;
  }
}

import { html } from 'lit';

import { AIStarIcon, AIStopIcon } from '../../../../icons/ai.js';
import { CopyIcon, DeleteIcon } from '../../../../icons/index.js';
import {
  InsertBelowIcon,
  ReplaceIcon,
  ResetIcon,
  WarningIcon,
} from '../../../../icons/misc.js';
import type { MessageRenderer } from '../../message-schema.js';
import { renderActions } from '../common/actions.js';

export const textRenderer: MessageRenderer<string> = ({ value, item }) => {
  const retry = () => item.retry();
  const stop = () => item.stop();
  if (value.status === 'loading') {
    return html`<div class="generating-tip">
      <div class="left">${AIStarIcon}</div>
      <div class="text">AI is generating...</div>
      <div @click="${stop}" class="right">${AIStopIcon}</div>
    </div>`;
  }
  const retryAndDiscard = renderActions([
    {
      actions: [
        { name: 'Regenerate', icon: ResetIcon, onSelect: retry },
        { name: 'Discard', icon: DeleteIcon, onSelect: () => {} },
      ],
    },
  ]);
  if (value.status === 'stop') {
    return retryAndDiscard;
  }
  if (value.status === 'error') {
    return html`
      <div class="error">
        <div class="answer-tip">
          <div class="top">Answer</div>
          <div class="bottom">
            An error occurred, If this issue persists please contact us through
            our help center at help.openai.com
          </div>
        </div>
        <div class="upgrade"><div class="content">Upgrade</div></div>
      </div>
      ${retryAndDiscard}
    `;
  }
  if (!value.done) {
    return html` ${renderAnswer(value.data)}
      <div class="generating-tip">
        <div class="left">${AIStarIcon}</div>
        <div class="text">AI is generating...</div>
        <div @click="${stop}" class="right">${AIStopIcon}</div>
      </div>`;
  }
  return html`
    ${renderAnswer(value.data)} ${retryAndDiscard} ${renderCommonAction()}
  `;
};
const renderAnswer = (text: string) => {
  return html`
    <style>
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

          .continue {
            display: flex;
            padding: 4px 8px;
            justify-content: center;
            align-items: center;
            gap: 4px;

            border-radius: 8px;
            border: 1px solid var(--light-detailColor-borderColor, #e3e2e4);
            background: var(--light-white-white10, rgba(255, 255, 255, 0.1));

            &:hover {
              background: var(
                --light-detailColor-hoverColor,
                rgba(0, 0, 0, 0.04)
              );
            }

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
        }
      }
    </style>
    <div class="answer">
      <div class="answer-head">Answer</div>
      <div class="answer-body">${text}</div>
    </div>
    <div class="finish-tip">
      ${WarningIcon}
      <div class="text">AI outputs can be misleading or wrong</div>
      <div class="right">
        <div class="copy">${CopyIcon}</div>
        <div class="continue">
          <div class="content">Continue in Chat</div>
        </div>
      </div>
    </div>
  `;
};
const renderCommonAction = () => {
  return renderActions([
    {
      name: 'RESULT ACTIONS',
      actions: [
        { name: 'Replace Selection', icon: ReplaceIcon, onSelect: () => {} },
        { name: 'Insert Below', icon: InsertBelowIcon, onSelect: () => {} },
      ],
    },
  ]);
};

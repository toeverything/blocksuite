import type { EditorHost } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { AssistantHistoryItem } from '../../../../_common/copilot/model/chat-history.js';
import type { Copilot } from '../../../../_common/copilot/model/index.js';
import { createCommonTextAction } from '../../../../_common/copilot/model/message-type/text/actions.js';
import { actionItemStyle, dividerStyle } from '../styles.js';

export type ActionPanelState = {
  type: 'input' | 'generating' | 'finished' | 'error';
  input: string | null;
};

@customElement('ai-action-panel-base')
export class AiActionPanelBase extends WithDisposable(LitElement) {
  static override styles = css`
    ${dividerStyle}
    ${actionItemStyle}

    .root {
      display: flex;
      padding: 12px 12px;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      gap: 8px;
      align-self: stretch;

      border-radius: var(--8, 8px);
      border: 1px solid var(--light-detailColor-borderColor, #e3e2e4);
      background: var(--light-background-backgroundOverlayPanelColor, #fbfbfc);

      /* light/toolbarShadow */
      box-shadow: 0px 6px 16px 0px rgba(0, 0, 0, 0.14);
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
        font-family: Inter;
        font-size: 14px;
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
  copilot!: Copilot;
  @property({ attribute: false })
  host!: EditorHost;
  @state()
  item?: AssistantHistoryItem;

  private _inputFinish = (input: string) => {
    this.item = this.copilot.askAI(createCommonTextAction(input), input);
  };

  override render() {
    if (this.item) {
      return html`<div class="root">${this.item.render(this.host)}</div>`;
    }
    return html`<ai-action-bar-input
      .onFinish=${this._inputFinish}
    ></ai-action-bar-input>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-action-panel-base': AiActionPanelBase;
  }
}

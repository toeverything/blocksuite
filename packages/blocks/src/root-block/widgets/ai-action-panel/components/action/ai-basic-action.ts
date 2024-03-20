import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import {
  InsertBelowIcon,
  ReplaceIcon,
} from '../../../../../_common/icons/misc.js';
import { actionItemStyle, dividerStyle } from '../../styles.js';

@customElement('ai-basic-action')
export class AIBasicAction extends WithDisposable(LitElement) {
  static override styles = css`
    ${dividerStyle}
    ${actionItemStyle}

    :host {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .divider {
      display: flex;
      padding: 0px 0px 4px 0px;
      flex-direction: column;
      align-items: flex-start;
      align-self: stretch;

      & > div {
        height: 0.5px;
        width: 100%;
        background: #e3e2e4;
      }
    }

    .head {
      display: flex;
      padding: 6px 12px;
      align-items: center;
      gap: 4px;
      align-self: stretch;

      .content {
        display: flex;
        padding: 0px 4px;
        align-items: center;
        flex: 1 0 0;

        color: var(
          --light-textColor-textSecondaryColor,
          var(--textColor-textSecondaryColor, #8e8d91)
        );
        text-align: justify;

        /* light/xsMedium */
        font-family: Inter;
        font-size: 12px;
        font-style: normal;
        font-weight: 500;
        line-height: 20px; /* 166.667% */
      }
    }
  `;

  override render() {
    return html`
      <div class="head">
        <div class="content">RESULT ACTIONS</div>
      </div>
      <div class="action-item">
        ${ReplaceIcon}
        <div class="content"><div>Replace Selection</div></div>
      </div>
      <div class="action-item">
        ${InsertBelowIcon}
        <div class="content"><div>Insert Below</div></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-basic-action': AIBasicAction;
  }
}

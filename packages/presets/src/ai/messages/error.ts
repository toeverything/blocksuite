import { type EditorHost, WithDisposable } from '@blocksuite/block-std';
import { html, LitElement, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { ErrorTipIcon } from '../_common/icons.js';
import { AIProvider } from '../provider.js';

@customElement('ai-error-wrapper')
class AIErrorWrapper extends WithDisposable(LitElement) {
  @property({ attribute: false })
  text!: string;

  protected override render() {
    return html` <style>
        .answer-tip {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          gap: 4px;
          align-self: stretch;
          border-radius: 4px;
          padding: 8px 8px 12px 8px;
          background-color: var(--affine-background-error-color);

          .bottom {
            align-items: flex-start;
            display: flex;
            gap: 8px;
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
            margin-bottom: 4px;

            a {
              color: inherit;
            }

            div svg {
              position: relative;
              top: 3px;
            }
          }
        }
      </style>
      <div class="answer-tip">
        <div class="bottom">
          <div>${ErrorTipIcon}</div>
          <div>${this.text}</div>
        </div>
        <slot></slot>
      </div>`;
  }
}

export const PaymentRequiredErrorRenderer = (host: EditorHost) => html`
  <style>
    .upgrade {
      cursor: pointer;
      display: flex;
      padding: 4px 12px;
      justify-content: center;
      align-items: center;
      gap: 4px;
      border-radius: 8px;
      margin-left: auto;
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
    .upgrade:hover {
      background: var(--affine-hover-color, rgba(0, 0, 0, 0.04));
    }
  </style>
  <ai-error-wrapper
    .text=${`You’ve reached the current usage cap for GPT-4. You can subscribe AFFiNE
        AI to continue AI experience!`}
  >
    <div
      @click=${() => AIProvider.slots.requestUpgradePlan.emit({ host: host })}
      class="upgrade"
    >
      <div class="content">Upgrade</div>
    </div></ai-error-wrapper
  >
`;

export const GeneralErrorRenderer = (
  text: string = `An error occurred, If this issue persists please let us know. contact@toeverything.info`,
  template: TemplateResult<1> = html`${nothing}`
) => html` <ai-error-wrapper .text=${text}>${template}</ai-error-wrapper>`;

declare global {
  interface HTMLElementTagNameMap {
    'ai-error-wrapper': AIErrorWrapper;
  }
}

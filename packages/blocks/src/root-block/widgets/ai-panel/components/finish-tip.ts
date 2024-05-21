import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { AIDoneIcon } from '../../../../_common/icons/ai.js';
import { WarningIcon } from '../../../../_common/icons/misc.js';
import { CopyIcon } from '../../../../_common/icons/text.js';
import type { CopyConfig } from '../type.js';

@customElement('ai-finish-tip')
export class AIFinishTip extends WithDisposable(LitElement) {
  static override styles = css`
    .finish-tip {
      display: flex;
      box-sizing: border-box;
      width: 100%;
      height: 22px;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px;
      gap: 4px;

      color: var(--affine-text-secondary-color);

      .text {
        display: flex;
        align-items: flex-start;
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

        .copy,
        .copied {
          display: flex;
          width: 20px;
          height: 20px;
          justify-content: center;
          align-items: center;
          border-radius: 8px;
          user-select: none;
        }
        .copy:hover {
          color: var(--affine-icon-color);
          background: var(--affine-hover-color);
          cursor: pointer;
        }
        .copied {
          color: var(--affine-brand-color);
        }
      }
    }
  `;

  @property({ attribute: false })
  accessor copy: CopyConfig | undefined = undefined;

  @state()
  accessor copied = false;

  override render() {
    return html`<div class="finish-tip">
      ${WarningIcon}
      <div class="text">AI outputs can be misleading or wrong</div>
      ${this.copy?.allowed
        ? html`<div class="right">
            ${this.copied
              ? html`<div class="copied">${AIDoneIcon}</div>`
              : html`<div
                  class="copy"
                  @click=${async () => {
                    this.copied = !!(await this.copy?.onCopy());
                  }}
                >
                  ${CopyIcon}
                  <affine-tooltip>Copy</affine-tooltip>
                </div>`}
          </div>`
        : nothing}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-finish-tip': AIFinishTip;
  }
}

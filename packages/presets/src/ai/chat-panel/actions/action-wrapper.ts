import type { EditorHost } from '@blocksuite/block-std';
import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { ActionIcon, ArrowDownIcon, ArrowUpIcon } from '../../_common/icons.js';
import { createTextRenderer } from '../../messages/text.js';
import type { ChatAction } from '../index.js';

@customElement('action-wrapper')
export class ActionWrapper extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .action-name {
      display: flex;
      align-items: center;
      gap: 18px;
      height: 22px;
      margin-bottom: 12px;
    }

    .action-name div:last-child {
      margin-left: auto;
      cursor: pointer;
    }

    .answer-prompt {
      padding: 8px;
      background-color: var(--affine-background-secondary-color);
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 14px;
      font-weight: 400;
      color: var(--affine-text-primary-color);
    }

    .answer-prompt .subtitle {
      font-size: 12px;
      font-weight: 500;
      color: var(--affine-text-secondary-color);
    }
  `;

  @state()
  promptShow = false;

  @property({ attribute: false })
  item!: ChatAction;

  @property({ attribute: false })
  host!: EditorHost;

  protected override render() {
    const { item } = this;

    const originalText = item.messages[1].content;
    return html`<style></style>
      <slot></slot>
      <div class="action-name">
        ${ActionIcon}
        <div>${item.action}</div>
        <div @click=${() => (this.promptShow = !this.promptShow)}>
          ${this.promptShow ? ArrowUpIcon : ArrowDownIcon}
        </div>
      </div>
      ${this.promptShow
        ? html`
            <div class="answer-prompt">
              <div class="subtitle">Answer</div>
              ${createTextRenderer(this.host)(item.messages[2].content)}
              <div class="subtitle">Prompt</div>
              ${createTextRenderer(this.host)(
                item.messages[0].content + originalText
              )}
            </div>
          `
        : nothing} `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'action-wrapper': ActionWrapper;
  }
}

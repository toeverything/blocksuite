import type { EditorHost } from '@blocksuite/block-std';

import { WithDisposable } from '@blocksuite/block-std';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { ChatAction } from '../chat-context.js';

import { createTextRenderer } from '../../messages/text.js';
import './action-wrapper.js';

@customElement('action-text')
export class ActionText extends WithDisposable(LitElement) {
  static override styles = css`
    .original-text {
      border-radius: 4px;
      margin-bottom: 12px;
      font-size: var(--affine-font-sm);
      line-height: 22px;
    }
  `;

  protected override render() {
    const originalText = this.item.messages[1].content;
    const { isCode } = this;

    return html` <action-wrapper .host=${this.host} .item=${this.item}>
      <div
        style=${styleMap({
          padding: isCode ? '0' : '10px 16px',
          border: isCode ? 'none' : '1px solid var(--affine-border-color)',
        })}
        class="original-text"
      >
        ${createTextRenderer(this.host, {
          customHeading: true,
          maxHeight: 160,
        })(originalText)}
      </div>
    </action-wrapper>`;
  }

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor isCode = false;

  @property({ attribute: false })
  accessor item!: ChatAction;
}

declare global {
  interface HTMLElementTagNameMap {
    'action-text': ActionText;
  }
}

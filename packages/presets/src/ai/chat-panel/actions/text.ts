import './action-wrapper.js';

import type { EditorHost } from '@blocksuite/block-std';
import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { createTextRenderer } from '../../messages/text.js';
import type { ChatAction } from '../index.js';

@customElement('action-text')
export class ActionText extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .original-text {
      width: 100%;
      padding: 0px 16px;
      border-radius: 4px;
      border: 1px solid var(--affine-border-color);
      margin-bottom: 12px;
      font-size: var(--affine-font-sm);
      line-height: 22px;
    }
  `;

  @property({ attribute: false })
  item!: ChatAction;

  @property({ attribute: false })
  host!: EditorHost;

  protected override render() {
    const originalText = this.item.messages[1].content;

    return html`<action-wrapper .host=${this.host} .item=${this.item}>
      <div class="original-text">
        ${createTextRenderer(this.host)(originalText)}
      </div>
    </action-wrapper>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'action-text': ActionText;
  }
}

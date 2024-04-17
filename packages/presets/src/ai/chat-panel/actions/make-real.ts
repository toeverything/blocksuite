import './action-wrapper.js';

import type { EditorHost } from '@blocksuite/block-std';
import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { createIframeRenderer } from '../../messages/wrapper.js';
import type { ChatAction } from '../index.js';

@customElement('action-make-real')
export class ActionMakeReal extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  item!: ChatAction;

  @property({ attribute: false })
  host!: EditorHost;

  protected override render() {
    const answer = this.item.messages[2].content;
    return html`<action-wrapper .host=${this.host} .item=${this.item}>
      <div style=${styleMap({ marginBottom: '12px' })}>
        ${createIframeRenderer(answer, 'finished')}
      </div>
    </action-wrapper>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'action-make-real': ActionMakeReal;
  }
}

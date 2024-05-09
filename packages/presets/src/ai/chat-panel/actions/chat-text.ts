import './action-wrapper.js';

import type { EditorHost } from '@blocksuite/block-std';
import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { createTextRenderer } from '../../messages/text.js';
import { renderImages } from '../components/images.js';
@customElement('chat-text')
export class ChatText extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  attachments?: string[];

  @property({ attribute: false })
  text!: string;

  @property({ attribute: false })
  state: 'finished' | 'generating' = 'finished';

  protected override render() {
    const { attachments, text, host } = this;
    return html`${attachments
      ? renderImages(attachments)
      : nothing}${createTextRenderer(host)(text, this.state)} `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'chat-text': ChatText;
  }
}

import './action-wrapper.js';

import type { EditorHost } from '@blocksuite/block-std';
import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { createTextRenderer } from '../../messages/text.js';
@customElement('chat-text')
export class ChatText extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .images-container {
      display: flex;
      gap: 12px;
    }
    .image-container {
      border-radius: 4px;
      width: 155px;
      height: 129px;
      overflow: hidden;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;

      img {
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
      }
    }
  `;
  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  blobs?: Blob[];

  @property({ attribute: false })
  text!: string;

  protected override render() {
    const { blobs, text, host } = this;
    return html`${blobs
      ? html`<div class="images-container">
          ${repeat(
            blobs,
            blob => blob,
            blob => {
              return html`<div class="image-container">
                <img src="${URL.createObjectURL(blob)}" />
              </div>`;
            }
          )}
        </div>`
      : nothing}${createTextRenderer(host)(text)} `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'chat-text': ChatText;
  }
}

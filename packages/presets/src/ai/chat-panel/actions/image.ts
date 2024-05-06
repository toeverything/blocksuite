import './action-wrapper.js';

import type { EditorHost } from '@blocksuite/block-std';
import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { renderImages } from '../components/images.js';
import type { ChatAction } from '../index.js';

@customElement('action-image')
export class ActionImage extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  item!: ChatAction;

  @property({ attribute: false })
  host!: EditorHost;

  protected override render() {
    const answer = this.item.messages[0].attachments;

    return html`<action-wrapper .host=${this.host} .item=${this.item}>
      <div style=${styleMap({ marginBottom: '12px' })}>
        ${answer ? renderImages(answer) : nothing}
      </div>
    </action-wrapper>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'action-image': ActionImage;
  }
}
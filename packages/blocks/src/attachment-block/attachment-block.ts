import { BlockElement } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { registerService } from '../__internal__/service.js';
import type { AttachmentBlockModel } from './attachment-model.js';
import { AttachmentBlockService } from './attachment-service.js';

@customElement('affine-attachment')
export class AttachmentBlockComponent extends BlockElement<AttachmentBlockModel> {
  static override styles = css``;

  override connectedCallback() {
    super.connectedCallback();
    registerService('affine:attachment', AttachmentBlockService);
  }

  override render() {
    return html`<div class="attachment-container">Attachment</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-attachment': AttachmentBlockComponent;
  }
}

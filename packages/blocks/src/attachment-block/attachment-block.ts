import { AttachmentIcon16 } from '@blocksuite/global/config';
import { BlockElement } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { registerService } from '../__internal__/service.js';
import { downloadBlob } from '../__internal__/utils/filesys.js';
import { humanFileSize } from '../__internal__/utils/math.js';
import { queryCurrentMode } from '../__internal__/utils/query.js';
import { toast } from '../components/toast.js';
import type { AttachmentBlockModel } from './attachment-model.js';
import { AttachmentBlockService } from './attachment-service.js';
import { AttachmentBanner, styles } from './styles.js';
import { getAttachment } from './utils.js';

// 30MB
const MAX_LOAD_SIZE = 30 * 1024 * 1024;

@customElement('affine-attachment')
export class AttachmentBlockComponent extends BlockElement<AttachmentBlockModel> {
  static override styles = styles;

  @state()
  loading = true;

  override connectedCallback() {
    super.connectedCallback();
    registerService('affine:attachment', AttachmentBlockService);
    if (!this.model.sourceId) {
      console.error('sourceId is not defined');
      return;
    }
    if (this.model.size > MAX_LOAD_SIZE) {
      return;
    }
  }

  async downloadAttachment() {
    const attachment = await getAttachment(this.model);
    if (!attachment) {
      toast('Failed to download attachment!');
      console.error(
        'attachment load failed! sourceId:',
        this.model.sourceId,
        'BlobManager:',
        this.model.page.blobs
      );
      return;
    }
    downloadBlob(attachment, this.model.name);
  }

  override render() {
    const mode = queryCurrentMode();
    // if (this.loading) {
    //   return html`<div class="attachment-container">Loading...</div>`;
    // }
    // if (!this.attachment) {
    //   return html`<div class="attachment-container">
    //     Error: Attachment not found
    //   </div>`;
    // }
    return html`<div
      class="attachment-container"
      @click=${this.downloadAttachment}
    >
      <div class="attachment-name">${AttachmentIcon16}${this.model.name}</div>
      <div class="attachment-size">${humanFileSize(this.model.size)}</div>
      <div class="attachment-banner">
        ${mode === 'light'
          ? AttachmentBanner
          : // TODO dark mode
            AttachmentBanner}
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-attachment': AttachmentBlockComponent;
  }
}

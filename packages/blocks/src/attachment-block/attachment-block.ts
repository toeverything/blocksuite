import { AttachmentIcon16 } from '@blocksuite/global/config';
import { BlockElement } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { registerService } from '../__internal__/service.js';
import { humanFileSize } from '../__internal__/utils/math.js';
import { queryCurrentMode } from '../__internal__/utils/query.js';
import { focusBlockByModel } from '../__internal__/utils/selection.js';
import { createLitPortal } from '../components/portal.js';
import type { AttachmentBlockModel } from './attachment-model.js';
import { AttachmentBlockService } from './attachment-service.js';
import { AttachmentOptionsTemplate } from './components/options.js';
import { AttachmentBanner, LoadingIcon, styles } from './styles.js';
import { downloadAttachment, isAttachmentLoading } from './utils.js';

@customElement('affine-attachment')
export class AttachmentBlockComponent extends BlockElement<AttachmentBlockModel> {
  static override styles = styles;

  override connectedCallback() {
    super.connectedCallback();
    registerService('affine:attachment', AttachmentBlockService);
  }

  private _focusAttachment() {
    focusBlockByModel(this.model);
  }

  private _optionsPortal: HTMLDivElement | null = null;

  private _onHover = () => {
    if (this._optionsPortal?.isConnected) return;
    const abortController = new AbortController();
    this._optionsPortal = createLitPortal({
      template: AttachmentOptionsTemplate({
        anchor: this,
        model: this.model,
        abortController,
      }),
      abortController,
    });
  };

  private async _downloadAttachment() {
    downloadAttachment(this.model);
  }

  override render() {
    const mode = queryCurrentMode();
    if (this.model.loadingKey && isAttachmentLoading(this.model.loadingKey)) {
      return html`<div class="attachment-container">
        <div class="attachment-loading">${LoadingIcon}Loading...</div>
        <div class="attachment-desc">${humanFileSize(this.model.size)}</div>
      </div>`;
    }
    if (!this.model.sourceId) {
      return html`<div class="attachment-container">
        <div class="attachment-name">${AttachmentIcon16}${this.model.name}</div>
        <div class="attachment-desc">Unable to upload</div>
      </div>`;
    }

    return html`<div
      class="attachment-container"
      @mouseover=${this._onHover}
      @click=${this._focusAttachment}
      @dblclick=${this._downloadAttachment}
    >
      <div class="attachment-name">${AttachmentIcon16}${this.model.name}</div>
      <div class="attachment-desc">${humanFileSize(this.model.size)}</div>
      <div class="attachment-banner">
        ${mode === 'light'
          ? AttachmentBanner
          : // TODO dark mode
            AttachmentBanner}
      </div>
      ${this.selected?.is('block')
        ? html`<affine-block-selection></affine-block-selection>`
        : null}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-attachment': AttachmentBlockComponent;
  }
}

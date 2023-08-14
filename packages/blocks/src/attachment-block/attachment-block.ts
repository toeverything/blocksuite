import { BlockElement, createLitPortal } from '@blocksuite/lit';
import { html, type PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

import { registerService } from '../__internal__/service/index.js';
import { stopPropagation } from '../__internal__/utils/event.js';
import { humanFileSize } from '../__internal__/utils/math.js';
import { AttachmentIcon16 } from '../icons/index.js';
import type {
  AttachmentBlockModel,
  AttachmentProps,
} from './attachment-model.js';
import { AttachmentBlockService } from './attachment-service.js';
import { AttachmentOptionsTemplate } from './components/options.js';
import {
  AttachmentBanner,
  ErrorBanner,
  LoadingIcon,
  styles,
} from './styles.js';
import { downloadAttachment, hasBlob, isAttachmentLoading } from './utils.js';

@customElement('affine-attachment')
export class AttachmentBlockComponent extends BlockElement<AttachmentBlockModel> {
  static override styles = styles;

  @state()
  private _showCaption = false;

  @query('input.affine-attachment-caption')
  private _captionInput!: HTMLInputElement;

  // Sometimes the attachment is unavailable
  // e.g. paste a attachment block from another workspace
  @state()
  private _error = false;

  override connectedCallback() {
    super.connectedCallback();
    registerService('affine:attachment', AttachmentBlockService);
    if (this.model.caption) {
      this._showCaption = true;
    }
    this._checkAttachment();
  }

  override willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('sourceId')) {
      this._checkAttachment();
    }
    super.willUpdate(changedProperties);
  }

  // Check if the attachment is available
  private async _checkAttachment() {
    const storage = this.page.blobs;
    const sourceId = this.model.sourceId;
    if (!sourceId) return;
    if (!(await hasBlob(storage, sourceId))) {
      this._error = true;
    }
  }

  private _focusAttachment() {
    const selectionManager = this.root.selectionManager;
    const blockSelection = selectionManager.getInstance('block', {
      path: this.path,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

  private _optionsPortal: HTMLDivElement | null = null;

  private _onHover = () => {
    if (this._optionsPortal?.isConnected) return;
    const abortController = new AbortController();
    this._optionsPortal = createLitPortal({
      template: AttachmentOptionsTemplate({
        anchor: this,
        model: this.model,
        showCaption: () => {
          this._showCaption = true;
          requestAnimationFrame(() => {
            this._captionInput.focus();
          });
        },
        abortController,
      }),
      abortController,
    });
  };

  private async _downloadAttachment() {
    downloadAttachment(this.model);
  }

  private _onBlur() {
    if (!this.model.caption) {
      this._showCaption = false;
    }
  }

  private _onInput(e: InputEvent) {
    const caption = (e.target as HTMLInputElement).value;
    this.model.page.updateBlock(this.model, {
      caption,
    } satisfies Partial<AttachmentProps>);
  }

  private _attachmentTail(isError: boolean) {
    return html`
      <div class="affine-attachment-banner">
        ${isError ? ErrorBanner() : AttachmentBanner()}
      </div>
      ${this.selected?.is('block')
        ? html`<affine-block-selection
            .borderRadius=${12}
            .borderWidth=${3}
          ></affine-block-selection>`
        : null}
    `;
  }

  override render() {
    const isLoading =
      this.model.loadingKey && isAttachmentLoading(this.model.loadingKey);
    const isError = !isLoading && (this._error || !this.model.sourceId);
    if (isLoading) {
      return html`<div
        class="affine-attachment-container"
        @click=${this._focusAttachment}
      >
        <div class="affine-attachment-loading">${LoadingIcon}Loading...</div>
        <div class="affine-attachment-desc">
          ${humanFileSize(this.model.size)}
        </div>
        ${this._attachmentTail(isError)}
      </div>`;
    }
    if (isError) {
      return html`<div
        class="affine-attachment-container"
        @click=${this._focusAttachment}
      >
        <div class="affine-attachment-name">
          ${AttachmentIcon16}${this.model.name}
        </div>
        <div class="affine-attachment-desc">Unable to upload</div>
        ${this._attachmentTail(isError)}
      </div>`;
    }

    return html`<div
        class="affine-attachment-container"
        @mouseover=${this._onHover}
        @click=${this._focusAttachment}
        @dblclick=${this._downloadAttachment}
      >
        <div class="affine-attachment-name">
          ${AttachmentIcon16}${this.model.name}
        </div>
        <div class="affine-attachment-desc">
          ${humanFileSize(this.model.size)}
        </div>
        ${this._attachmentTail(isError)}
      </div>
      <input
        ?hidden=${!this._showCaption}
        .disabled=${this.model.page.readonly}
        class="affine-attachment-caption"
        placeholder="Write a caption"
        value=${this.model.caption ?? ''}
        @input=${this._onInput}
        @blur=${this._onBlur}
        @pointerdown=${stopPropagation}
      />`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-attachment': AttachmentBlockComponent;
  }
}

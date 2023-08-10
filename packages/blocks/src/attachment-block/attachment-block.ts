import { AttachmentIcon16 } from '@blocksuite/global/config';
import { BlockElement, createLitPortal } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

import { registerService } from '../__internal__/service/index.js';
import { stopPropagation } from '../__internal__/utils/event.js';
import { humanFileSize } from '../__internal__/utils/math.js';
import { queryCurrentMode } from '../__internal__/utils/query.js';
import type {
  AttachmentBlockModel,
  AttachmentProps,
} from './attachment-model.js';
import { AttachmentBlockService } from './attachment-service.js';
import { AttachmentOptionsTemplate } from './components/options.js';
import { AttachmentBanner, LoadingIcon, styles } from './styles.js';
import { downloadAttachment, isAttachmentLoading } from './utils.js';

@customElement('affine-attachment')
export class AttachmentBlockComponent extends BlockElement<AttachmentBlockModel> {
  static override styles = styles;

  @state()
  private _showCaption = false;

  @query('input.affine-attachment-caption')
  _captionInput!: HTMLInputElement;

  override connectedCallback() {
    super.connectedCallback();
    registerService('affine:attachment', AttachmentBlockService);
    if (this.model.caption) {
      this._showCaption = true;
    }
  }

  private _focusAttachment() {
    const selectionManager = this.root.selectionManager;
    const blockSelection = selectionManager.getInstance('block', {
      path: this.path,
    });
    selectionManager.set([blockSelection]);
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

  override render() {
    const mode = queryCurrentMode();
    if (this.model.loadingKey && isAttachmentLoading(this.model.loadingKey)) {
      return html`<div class="affine-attachment-container">
        <div class="affine-attachment-loading">${LoadingIcon}Loading...</div>
        <div class="affine-attachment-desc">
          ${humanFileSize(this.model.size)}
        </div>
      </div>`;
    }
    if (!this.model.sourceId) {
      return html`<div class="affine-attachment-container">
        <div class="affine-attachment-name">
          ${AttachmentIcon16}${this.model.name}
        </div>
        <div class="affine-attachment-desc">Unable to upload</div>
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

        <div class="affine-attachment-banner">
          ${mode === 'light'
            ? AttachmentBanner
            : // TODO dark mode
              AttachmentBanner}
        </div>
        ${this.selected?.is('block')
          ? html`<affine-block-selection
              .borderRadius=${12}
              .borderWidth=${3}
            ></affine-block-selection>`
          : null}
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

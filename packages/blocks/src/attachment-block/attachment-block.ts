import { BlockElement } from '@blocksuite/lit';
import { flip, offset } from '@floating-ui/dom';
import { html, type PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { ref } from 'lit/directives/ref.js';

import { HoverController } from '../_common/components/index.js';
import { toast } from '../_common/components/toast.js';
import { AttachmentIcon16 } from '../_common/icons/index.js';
import { ThemeObserver } from '../_common/theme/theme-observer.js';
import { stopPropagation } from '../_common/utils/event.js';
import { humanFileSize } from '../_common/utils/math.js';
import { AffineDragHandleWidget } from '../_common/widgets/drag-handle/index.js';
import { captureEventTarget } from '../_common/widgets/drag-handle/utils.js';
import {
  type AttachmentBlockModel,
  type AttachmentBlockProps,
  AttachmentBlockSchema,
} from './attachment-model.js';
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

  @state()
  private _isDownloading = false;

  private readonly _themeObserver = new ThemeObserver();

  private _hoverController = new HoverController(
    this,
    ({ abortController }) => ({
      template: AttachmentOptionsTemplate({
        anchor: this,
        model: this.model,
        showCaption: () => {
          this._showCaption = true;
          requestAnimationFrame(() => {
            this._captionInput.focus();
          });
        },
        downloadAttachment: this._downloadAttachment.bind(this),
        abortController,
      }),
      computePosition: {
        referenceElement: this,
        placement: 'top-end',
        middleware: [flip(), offset(4)],
        autoUpdate: true,
      },
    })
  );

  override connectedCallback() {
    super.connectedCallback();
    if (this.model.caption) {
      this._showCaption = true;
    }
    this._checkBlob();
    this._registerDragHandleOption();

    // Workaround for https://github.com/toeverything/blocksuite/issues/4724
    this._themeObserver.observe(document.documentElement);
    this._themeObserver.on(() => this.requestUpdate());
    this.disposables.add(() => this._themeObserver.dispose());
  }

  override willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('sourceId')) {
      this._checkBlob();
    }
    super.willUpdate(changedProperties);
  }

  private _registerDragHandleOption = () => {
    this._disposables.add(
      AffineDragHandleWidget.registerOption({
        flavour: AttachmentBlockSchema.model.flavour,
        onDragStart: (state, startDragging) => {
          // Check if start dragging from the image block
          const target = captureEventTarget(state.raw.target);
          const attachmentBlock = target?.closest('affine-attachment');
          if (!attachmentBlock) return false;

          // If start dragging from the attachment element
          // Set selection and take over dragStart event to start dragging
          this.root.selection.set([
            this.root.selection.getInstance('block', {
              path: attachmentBlock.path,
            }),
          ]);
          startDragging([attachmentBlock], state);
          return true;
        },
      })
    );
  };

  /**
   * Check if the blob is available. It is necessary since the block may be copied from another workspace.
   */
  private async _checkBlob() {
    const storage = this.page.blob;
    const sourceId = this.model.sourceId;
    if (!sourceId) return;
    if (!(await hasBlob(storage, sourceId))) {
      console.warn(
        'The attachment is unavailable since the blob is missing!',
        this.model
      );
      this._error = true;
    }
  }

  private _focusAttachment() {
    const selectionManager = this.root.selection;
    const blockSelection = selectionManager.getInstance('block', {
      path: this.path,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

  private async _downloadAttachment() {
    if (this._isDownloading) {
      toast('Download in progress...');
      return;
    }

    const shortName =
      this.model.name.length < 20
        ? this.model.name
        : this.model.name.slice(0, 20) + '...';

    toast(`Downloading ${shortName}`);
    this._isDownloading = true;
    try {
      await downloadAttachment(this.model);
    } catch (error) {
      console.error(error);
      toast(`Failed to download ${shortName}!`);
    } finally {
      this._isDownloading = false;
    }
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
    } satisfies Partial<AttachmentBlockProps>);
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
    const isLoading = isAttachmentLoading(this.model.id);
    const isError = this._error || (!isLoading && !this.model.sourceId);

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
        <div class="affine-attachment-title">
          ${AttachmentIcon16}
          <span class="affine-attachment-name">${this.model.name}</span>
        </div>
        <div class="affine-attachment-desc">Unable to upload</div>
        ${this._attachmentTail(isError)}
      </div>`;
    }

    return html`<div
        ${ref(this._hoverController.setReference)}
        class="affine-attachment-container"
        @click=${this._focusAttachment}
        @dblclick=${this._downloadAttachment}
      >
        <div class="affine-attachment-title">
          ${this._isDownloading ? LoadingIcon : AttachmentIcon16}
          <span class="affine-attachment-name">${this.model.name}</span>
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

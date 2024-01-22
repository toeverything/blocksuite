import { BlockElement } from '@blocksuite/lit';
import { flip, offset } from '@floating-ui/dom';
import { html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { ref } from 'lit/directives/ref.js';

import { HoverController } from '../_common/components/index.js';
import { toast } from '../_common/components/toast.js';
import { AttachmentIcon16 } from '../_common/icons/index.js';
import { ThemeObserver } from '../_common/theme/theme-observer.js';
import { stopPropagation } from '../_common/utils/event.js';
import { humanFileSize } from '../_common/utils/math.js';
import { AffineDragHandleWidget } from '../page-block/widgets/drag-handle/drag-handle.js';
import { captureEventTarget } from '../page-block/widgets/drag-handle/utils.js';
import {
  type AttachmentBlockModel,
  type AttachmentBlockProps,
  AttachmentBlockSchema,
} from './attachment-model.js';
import { AttachmentOptionsTemplate } from './components/options.js';
import { allowEmbed, renderEmbedView } from './embed.js';
import {
  AttachmentBanner,
  ErrorBanner,
  LoadingIcon,
  styles,
} from './styles.js';
import {
  downloadAttachmentBlob,
  getAttachmentBlob,
  isAttachmentLoading,
} from './utils.js';

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

  @state()
  private _blobUrl?: string;

  @state()
  private _pointerPressed = false;

  private readonly _themeObserver = new ThemeObserver();

  private _hoverController = new HoverController(
    this,
    ({ abortController }) => {
      const selection = this.host.selection;
      const textSelection = selection.find('text');
      if (
        !!textSelection &&
        (!!textSelection.to || !!textSelection.from.length)
      ) {
        return null;
      }

      const blockSelections = selection.filter('block');
      if (
        blockSelections.length > 1 ||
        (blockSelections.length === 1 && blockSelections[0].path !== this.path)
      ) {
        return null;
      }

      return {
        template: AttachmentOptionsTemplate({
          anchor: this,
          model: this.model,
          showCaption: () => {
            this._showCaption = true;
            requestAnimationFrame(() => {
              this._captionInput.focus();
            });
          },
          downloadAttachment: this._downloadAttachment,
          abortController,
        }),
        computePosition: {
          referenceElement: this,
          placement: 'top-end',
          middleware: [flip(), offset(4)],
          autoUpdate: true,
        },
      };
    }
  );

  override connectedCallback() {
    super.connectedCallback();

    this.contentEditable = 'false';

    if (this.model.caption) {
      this._showCaption = true;
    }
    this._checkBlob().catch(console.error);
    this._registerDragHandleOption();

    // Workaround for https://github.com/toeverything/blocksuite/issues/4724
    this._themeObserver.observe(document.documentElement);
    this._themeObserver.on(() => this.requestUpdate());
    this.disposables.add(() => this._themeObserver.dispose());

    this.model.propsUpdated.on(({ key }) => {
      if (key === 'sourceId') {
        // Reset the blob url when the sourceId is changed
        if (this._blobUrl) {
          URL.revokeObjectURL(this._blobUrl);
          this._blobUrl = undefined;
        }
        this._checkBlob().catch(console.error);
      }
    });

    this.disposables.add(
      this.std.event.add('pointerDown', e => {
        const event = e.get('pointerState');
        // 0: Main button pressed, usually the left button or the un-initialized state
        // See https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
        if (event.button !== 0) return;
        this._pointerPressed = true;
      })
    );
    this.disposables.add(
      this.std.event.add('pointerUp', e => {
        const event = e.get('pointerState');
        // 0: Main button pressed, usually the left button or the un-initialized state
        if (event.button !== 0) return;
        this._pointerPressed = false;
      })
    );
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this._blobUrl) {
      URL.revokeObjectURL(this._blobUrl);
    }
  }

  private _registerDragHandleOption = () => {
    this._disposables.add(
      AffineDragHandleWidget.registerOption({
        flavour: AttachmentBlockSchema.model.flavour,
        onDragStart: ({ state, startDragging }) => {
          // Check if start dragging from the attachment block
          const target = captureEventTarget(state.raw.target);
          const attachmentBlock = target?.closest('affine-attachment');
          if (!attachmentBlock) return false;

          // If start dragging from the attachment element
          // Set selection and take over dragStart event to start dragging
          this.host.selection.set([
            this.host.selection.create('block', {
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
  private _checkBlob = async () => {
    const sourceId = this.model.sourceId;
    if (!sourceId) return;
    try {
      const blob = await getAttachmentBlob(this.model);
      if (!blob) throw new Error('Blob is missing!');
      // TODO we no need to create blob url when the attachment is not embedded
      if (allowEmbed(this.model)) {
        this._blobUrl = URL.createObjectURL(blob);
      }
    } catch (_) {
      this._error = true;
      console.warn(
        'The attachment is unavailable since the blob is missing!',
        this.model,
        sourceId
      );
    }
  };

  private _focusAttachment = () => {
    const selectionManager = this.host.selection;
    const blockSelection = selectionManager.create('block', {
      path: this.path,
    });
    selectionManager.setGroup('note', [blockSelection]);
  };

  private _downloadAttachment = async () => {
    if (this._isDownloading) {
      toast(this.host, 'Download in progress...');
      return;
    }

    const shortName =
      this.model.name.length < 20
        ? this.model.name
        : this.model.name.slice(0, 20) + '...';

    toast(this.host, `Downloading ${shortName}`);
    this._isDownloading = true;
    // TODO speed up download by using this._blobUrl
    try {
      await downloadAttachmentBlob(this.host, this.model);
    } catch (error) {
      console.error(error);
      toast(this.host, `Failed to download ${shortName}!`);
    } finally {
      this._isDownloading = false;
    }
  };

  private _onBlur = () => {
    if (!this.model.caption) {
      this._showCaption = false;
    }
  };

  private _onInput = (e: InputEvent) => {
    const caption = (e.target as HTMLInputElement).value;
    this.model.page.updateBlock(this.model, {
      caption,
    } satisfies Partial<AttachmentBlockProps>);
  };

  private _attachmentTail = (isError: boolean) => {
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
  };

  private _captionTemplate = () => {
    return html`<input
      ?hidden=${!this._showCaption}
      .disabled=${this.model.page.readonly}
      class="affine-attachment-caption"
      placeholder="Write a caption"
      value=${this.model.caption ?? ''}
      @input=${this._onInput}
      @blur=${this._onBlur}
      @pointerdown=${stopPropagation}
    />`;
  };

  override renderBlock() {
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
        <div class="affine-attachment-desc">
          Unable to upload or download attachment
        </div>
        ${this._attachmentTail(isError)}
      </div>`;
    }

    if (this.model.embed && this._blobUrl) {
      const embedView = renderEmbedView(this.model, this._blobUrl);
      if (embedView) {
        // See https://github.com/toeverything/blocksuite/issues/5579
        const selectionMask = this._pointerPressed
          ? html`<div class="overlay-mask"></div>`
          : null;
        return html`<div
            ${ref(this._hoverController.setReference)}
            class="affine-attachment-embed-container"
          >
            ${selectionMask} ${embedView}
            ${this.selected?.is('block')
              ? html`<affine-block-selection></affine-block-selection>`
              : null}
          </div>
          ${this._captionTemplate()}`;
      }
    }
    const isDownloadingOrLoadingBlob =
      this._isDownloading || (this.model.embed && !this._blobUrl);

    return html`<div
        ${ref(this._hoverController.setReference)}
        class="affine-attachment-container"
        @click=${this._focusAttachment}
        @dblclick=${this._downloadAttachment}
      >
        <div class="affine-attachment-title">
          ${isDownloadingOrLoadingBlob ? LoadingIcon : AttachmentIcon16}
          <span class="affine-attachment-name">${this.model.name}</span>
        </div>
        <div class="affine-attachment-desc">
          ${humanFileSize(this.model.size)}
        </div>
        ${this._attachmentTail(isError)}
      </div>
      ${this._captionTemplate()}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-attachment': AttachmentBlockComponent;
  }
}

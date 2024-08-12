import { HoverController } from '@blocksuite/affine-components/hover';
import {
  AttachmentIcon16,
  getAttachmentFileIcons,
} from '@blocksuite/affine-components/icons';
import { toast } from '@blocksuite/affine-components/toast';
import {
  type AttachmentBlockModel,
  AttachmentBlockStyles,
} from '@blocksuite/affine-model';
import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import { humanFileSize } from '@blocksuite/affine-shared/utils';
import { Bound } from '@blocksuite/global/utils';
import { Slice } from '@blocksuite/store';
import { flip, offset } from '@floating-ui/dom';
import { html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessRootService } from '../root-block/index.js';
import type { AttachmentBlockService } from './attachment-service.js';

import { CaptionedBlockComponent } from '../_common/components/index.js';
import { bindContainerHotkey } from '../_common/components/rich-text/keymap/container.js';
import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';
import { getEmbedCardIcons } from '../_common/utils/url.js';
import { AttachmentOptionsTemplate } from './components/options.js';
import { renderEmbedView } from './embed.js';
import { styles } from './styles.js';
import { checkAttachmentBlob, downloadAttachmentBlob } from './utils.js';

@customElement('affine-attachment')
export class AttachmentBlockComponent extends CaptionedBlockComponent<
  AttachmentBlockModel,
  AttachmentBlockService
> {
  private _isDragging = false;

  private _isInSurface = false;

  private _isResizing = false;

  private _isSelected = false;

  private _whenHover = new HoverController(this, ({ abortController }) => {
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
      (blockSelections.length === 1 &&
        blockSelections[0].blockId !== this.blockId)
    ) {
      return null;
    }

    return {
      template: AttachmentOptionsTemplate({
        anchor: this,
        model: this.model,
        showCaption: () => this.captionEditor?.show(),
        copy: this.copy,
        download: this.download,
        refresh: this.refreshData,
        abortController,
      }),
      computePosition: {
        referenceElement: this,
        placement: 'top-start',
        middleware: [flip(), offset(4)],
        autoUpdate: true,
      },
    };
  });

  static override styles = styles;

  copy = () => {
    const slice = Slice.fromModels(this.doc, [this.model]);
    this.std.clipboard.copySlice(slice).catch(console.error);
    toast(this.host, 'Copied to clipboard');
  };

  download = () => {
    downloadAttachmentBlob(this);
  };

  open = () => {
    if (!this.blobUrl) {
      return;
    }
    window.open(this.blobUrl, '_blank');
  };

  refreshData = () => {
    checkAttachmentBlob(this).catch(console.error);
  };

  private get _embedView() {
    if (this.isInSurface || !this.model.embed || !this.blobUrl) return;
    return renderEmbedView(this.model, this.blobUrl, this.service.maxFileSize);
  }

  private _handleClick(event: MouseEvent) {
    event.stopPropagation();
    if (!this.isInSurface) {
      this._selectBlock();
    }
  }

  private _handleDoubleClick(event: MouseEvent) {
    event.stopPropagation();
    if (this.allowEmbed) {
      this.open();
    } else {
      this.download();
    }
  }

  private _selectBlock() {
    const selectionManager = this.host.selection;
    const blockSelection = selectionManager.create('block', {
      blockId: this.blockId,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

  override connectedCallback() {
    super.connectedCallback();

    bindContainerHotkey(this);

    this.refreshData();

    this.contentEditable = 'false';

    const parent = this.host.doc.getParent(this.model);
    this._isInSurface = parent?.flavour === 'affine:surface';

    if (!this.model.style) {
      this.doc.withoutTransact(() => {
        this.doc.updateBlock(this.model, {
          style: AttachmentBlockStyles[1],
        });
      });
    }

    this.model.propsUpdated.on(({ key }) => {
      if (key === 'sourceId') {
        // Reset the blob url when the sourceId is changed
        if (this.blobUrl) {
          URL.revokeObjectURL(this.blobUrl);
          this.blobUrl = undefined;
        }
        this.refreshData();
      }
    });

    // Workaround for https://github.com/toeverything/blocksuite/issues/4724
    this.disposables.add(ThemeObserver.subscribe(() => this.requestUpdate()));

    // this is required to prevent iframe from capturing pointer events
    this.disposables.add(
      this.std.selection.slots.changed.on(() => {
        this._isSelected =
          !!this.selected?.is('block') || !!this.selected?.is('surface');

        this._showOverlay =
          this._isResizing || this._isDragging || !this._isSelected;
      })
    );
    // this is required to prevent iframe from capturing pointer events
    this.handleEvent('dragStart', () => {
      this._isDragging = true;
      this._showOverlay =
        this._isResizing || this._isDragging || !this._isSelected;
    });

    this.handleEvent('dragEnd', () => {
      this._isDragging = false;
      this._showOverlay =
        this._isResizing || this._isDragging || !this._isSelected;
    });

    if (this.isInSurface) {
      if (this.rootService) {
        this._disposables.add(
          this.rootService?.slots.elementResizeStart.on(() => {
            this._isResizing = true;
            this._showOverlay = true;
          })
        );

        this._disposables.add(
          this.rootService.slots.elementResizeEnd.on(() => {
            this._isResizing = false;
            this._showOverlay =
              this._isResizing || this._isDragging || !this._isSelected;
          })
        );
      }

      this.style.position = 'absolute';
    }
  }

  override disconnectedCallback() {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
    }
    super.disconnectedCallback();
  }

  override renderBlock() {
    const { name, size, style } = this.model;
    const cardStyle = style ?? AttachmentBlockStyles[1];

    const { LoadingIcon } = getEmbedCardIcons();

    const titleIcon = this.loading ? LoadingIcon : AttachmentIcon16;
    const titleText = this.loading ? 'Loading...' : name;
    const infoText = this.error ? 'File loading failed.' : humanFileSize(size);

    const fileType = name.split('.').pop() ?? '';
    const FileTypeIcon = getAttachmentFileIcons(fileType);

    let containerStyleMap = styleMap({
      position: 'relative',
      width: '100%',
      margin: '18px 0px',
    });

    if (this.isInSurface) {
      const width = EMBED_CARD_WIDTH[cardStyle];
      const height = EMBED_CARD_HEIGHT[cardStyle];
      const bound = Bound.deserialize(
        (this.rootService?.getElementById(this.model.id) ?? this.model).xywh
      );
      const scaleX = bound.w / width;
      const scaleY = bound.h / height;
      containerStyleMap = styleMap({
        width: `${width}px`,
        height: `${height}px`,
        transform: `scale(${scaleX}, ${scaleY})`,
        transformOrigin: '0 0',
      });

      this.style.width = `${bound.w}px`;
      this.style.height = `${bound.h}px`;
      this.style.left = `${bound.x}px`;
      this.style.top = `${bound.y}px`;
      this.style.zIndex = `${this.toZIndex()}`;
    }

    const embedView = this._embedView;

    return html`
      <div
        ${this.isInSurface ? nothing : ref(this._whenHover.setReference)}
        class="affine-attachment-container"
        style=${containerStyleMap}
      >
        ${embedView
          ? html`<div
              class="affine-attachment-embed-container"
              @click=${this._handleClick}
              @dblclick=${this._handleDoubleClick}
            >
              ${embedView}

              <div
                class=${classMap({
                  'affine-attachment-iframe-overlay': true,
                  hide: !this._showOverlay,
                })}
              ></div>
            </div>`
          : html`<div
              class=${classMap({
                'affine-attachment-card': true,
                [cardStyle]: true,
                loading: this.loading,
                error: this.error,
                unsynced: false,
              })}
              @click=${this._handleClick}
              @dblclick=${this._handleDoubleClick}
            >
              <div class="affine-attachment-content">
                <div class="affine-attachment-content-title">
                  <div class="affine-attachment-content-title-icon">
                    ${titleIcon}
                  </div>

                  <div class="affine-attachment-content-title-text">
                    ${titleText}
                  </div>
                </div>

                <div class="affine-attachment-content-info">${infoText}</div>
              </div>

              <div class="affine-attachment-banner">${FileTypeIcon}</div>
            </div>`}
      </div>
    `;
  }

  toZIndex() {
    return this.rootService?.layer.getZIndex(this.model) ?? 1;
  }

  updateZIndex() {
    this.style.zIndex = `${this.toZIndex()}`;
  }

  get isInSurface() {
    return this._isInSurface;
  }

  get rootService() {
    const service = this.host.spec.getService(
      'affine:page'
    ) as EdgelessRootService;

    if (!service.surface) {
      return null;
    }

    return service;
  }

  @state()
  private accessor _showOverlay = true;

  @property({ attribute: false })
  accessor allowEmbed = false;

  @property({ attribute: false })
  accessor blobUrl: string | undefined = undefined;

  @property({ attribute: false })
  accessor downloading = false;

  @property({ attribute: false })
  accessor error = false;

  @property({ attribute: false })
  accessor loading = false;

  override accessor useCaptionEditor = true;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-attachment': AttachmentBlockComponent;
  }
}

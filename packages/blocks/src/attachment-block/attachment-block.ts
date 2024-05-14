import '../_common/components/block-selection.js';
import '../_common/components/embed-card/embed-card-caption.js';

import { BlockElement } from '@blocksuite/block-std';
import { flip, offset } from '@floating-ui/dom';
import { html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EmbedCardCaption } from '../_common/components/embed-card/embed-card-caption.js';
import { HoverController } from '../_common/components/index.js';
import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';
import {
  AttachmentIcon16,
  getAttachmentFileIcons,
} from '../_common/icons/index.js';
import { ThemeObserver } from '../_common/theme/theme-observer.js';
import { humanFileSize } from '../_common/utils/math.js';
import { getEmbedCardIcons } from '../_common/utils/url.js';
import { Bound } from '../surface-block/utils/bound.js';
import {
  type AttachmentBlockModel,
  AttachmentBlockStyles,
} from './attachment-model.js';
import type { AttachmentBlockService } from './attachment-service.js';
import { AttachmentOptionsTemplate } from './components/options.js';
import { renderEmbedView } from './embed.js';
import { styles } from './styles.js';
import { checkAttachmentBlob, downloadAttachmentBlob } from './utils.js';

@customElement('affine-attachment')
export class AttachmentBlockComponent extends BlockElement<
  AttachmentBlockModel,
  AttachmentBlockService
> {
  static override styles = styles;

  @property({ attribute: false })
  loading = false;

  @property({ attribute: false })
  error = false;

  @property({ attribute: false })
  downloading = false;

  @property({ attribute: false })
  blobUrl?: string;

  @property({ attribute: false })
  allowEmbed = false;

  @query('embed-card-caption')
  captionElement!: EmbedCardCaption;

  @state()
  private _showOverlay = true;

  private _isSelected = false;

  private _isDragging = false;

  private _isResizing = false;

  private readonly _themeObserver = new ThemeObserver();

  private _isInSurface = false;

  get isInSurface() {
    return this._isInSurface;
  }

  get edgeless() {
    if (!this._isInSurface) {
      return null;
    }
    return this.host.querySelector('affine-edgeless-root');
  }

  private get _embedView() {
    if (this.isInSurface || !this.model.embed || !this.blobUrl) return;
    return renderEmbedView(this.model, this.blobUrl, this.service.maxFileSize);
  }

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
        showCaption: () => this.captionElement.show(),
        downloadAttachment: this.download,
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

  private _selectBlock() {
    const selectionManager = this.host.selection;
    const blockSelection = selectionManager.create('block', {
      blockId: this.blockId,
    });
    selectionManager.setGroup('note', [blockSelection]);
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

  open = () => {
    if (!this.blobUrl) {
      return;
    }
    window.open(this.blobUrl, '_blank');
  };

  download = () => {
    downloadAttachmentBlob(this);
  };

  refreshData = () => {
    checkAttachmentBlob(this).catch(console.error);
  };

  override connectedCallback() {
    super.connectedCallback();

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
    this._themeObserver.observe(document.documentElement);
    this._themeObserver.on(() => this.requestUpdate());
    this.disposables.add(() => this._themeObserver.dispose());

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
    this.handleEvent('pointerMove', ctx => {
      this._isDragging = ctx.get('pointerState').dragging;
      this._showOverlay =
        this._isResizing || this._isDragging || !this._isSelected;
    });

    if (this.isInSurface) {
      this.edgeless?.slots.elementResizeStart.on(() => {
        this._isResizing = true;
        this._showOverlay = true;
      });

      this.edgeless?.slots.elementResizeEnd.on(() => {
        this._isResizing = false;
        this._showOverlay =
          this._isResizing || this._isDragging || !this._isSelected;
      });
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
        (this.edgeless?.service.getElementById(this.model.id) ?? this.model)
          .xywh
      );
      const scaleX = bound.w / width;
      const scaleY = bound.h / height;
      containerStyleMap = styleMap({
        width: `${width}px`,
        height: `${height}px`,
        transform: `scale(${scaleX}, ${scaleY})`,
        transformOrigin: '0 0',
      });
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

        <embed-card-caption .block=${this}></embed-card-caption>

        <affine-block-selection .block=${this}></affine-block-selection>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-attachment': AttachmentBlockComponent;
  }
}

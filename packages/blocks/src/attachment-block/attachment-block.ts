import '../_common/components/embed-card/embed-card-caption.js';

import { PathFinder } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import { flip, offset } from '@floating-ui/dom';
import { html, nothing, render } from 'lit';
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
import { matchFlavours } from '../_common/utils/model.js';
import { getEmbedCardIcons } from '../_common/utils/url.js';
import type { DragHandleOption } from '../page-block/widgets/drag-handle/config.js';
import {
  AFFINE_DRAG_HANDLE_WIDGET,
  AffineDragHandleWidget,
} from '../page-block/widgets/drag-handle/drag-handle.js';
import {
  captureEventTarget,
  convertDragPreviewDocToEdgeless,
  convertDragPreviewEdgelessToDoc,
} from '../page-block/widgets/drag-handle/utils.js';
import { Bound } from '../surface-block/utils/bound.js';
import {
  type AttachmentBlockModel,
  AttachmentBlockSchema,
  AttachmentBlockStyles,
} from './attachment-model.js';
import { AttachmentOptionsTemplate } from './components/options.js';
import { renderEmbedView } from './embed.js';
import { styles } from './styles.js';
import { checkAttachmentBlob, downloadAttachmentBlob } from './utils.js';

@customElement('affine-attachment')
export class AttachmentBlockComponent extends BlockElement<AttachmentBlockModel> {
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

  @property({ attribute: false })
  showCaption = false;

  @query('embed-card-caption')
  captionElement!: EmbedCardCaption;

  @state()
  private _showOverlay = true;

  private _isSelected = false;

  private _isDragging = false;

  private readonly _themeObserver = new ThemeObserver();

  private _isInSurface = false;

  get isInSurface() {
    return this._isInSurface;
  }

  get edgeless() {
    if (this._isInSurface) return null;
    return this.host.querySelector('affine-edgeless-page');
  }

  private get _embedView() {
    if (this.isInSurface || !this.model.embed || !this.blobUrl) return;
    return renderEmbedView(this.model, this.blobUrl);
  }

  private _dragHandleOption: DragHandleOption = {
    flavour: AttachmentBlockSchema.model.flavour,
    edgeless: true,
    onDragStart: ({ state, startDragging, anchorBlockPath }) => {
      if (!anchorBlockPath) return false;
      const anchorComponent = this.std.view.viewFromPath(
        'block',
        anchorBlockPath
      );
      if (
        !anchorComponent ||
        !matchFlavours(anchorComponent.model, [
          AttachmentBlockSchema.model.flavour,
        ])
      )
        return false;

      const blockComponent = anchorComponent as AttachmentBlockComponent;
      const element = captureEventTarget(state.raw.target);

      const isDraggingByDragHandle = !!element?.closest(
        AFFINE_DRAG_HANDLE_WIDGET
      );
      const isDraggingByComponent = blockComponent.contains(element);
      const isInSurface = blockComponent.isInSurface;

      if (!isInSurface && (isDraggingByDragHandle || isDraggingByComponent)) {
        this.host.selection.setGroup('note', [
          this.host.selection.create('block', {
            path: blockComponent.path,
          }),
        ]);
        startDragging([blockComponent], state);
        return true;
      } else if (isInSurface && isDraggingByDragHandle) {
        const attachmentPortal = blockComponent.closest(
          '.edgeless-block-portal-attachment'
        );
        assertExists(attachmentPortal);
        const dragPreviewEl = attachmentPortal.cloneNode() as HTMLElement;
        dragPreviewEl.style.transform = '';
        dragPreviewEl.style.left = '0';
        dragPreviewEl.style.top = '0';
        render(
          blockComponent.host.renderModel(blockComponent.model),
          dragPreviewEl
        );

        startDragging([blockComponent], state, dragPreviewEl);
        return true;
      }
      return false;
    },
    onDragEnd: props => {
      const { state, draggingElements, dropBlockId } = props;
      if (
        draggingElements.length !== 1 ||
        !matchFlavours(draggingElements[0].model, [
          AttachmentBlockSchema.model.flavour,
        ])
      )
        return false;

      const blockComponent = draggingElements[0] as AttachmentBlockComponent;
      const isInSurface = blockComponent.isInSurface;
      const target = captureEventTarget(state.raw.target);
      const isTargetEdgelessContainer =
        target?.classList.contains('edgeless') &&
        target?.classList.contains('affine-block-children-container');

      if (isInSurface) {
        if (dropBlockId) {
          const style = blockComponent.model.style;
          if (style === 'cubeThick') {
            const { xywh } = blockComponent.model;
            const bound = Bound.deserialize(xywh);
            bound.w = EMBED_CARD_WIDTH.horizontalThin;
            bound.h = EMBED_CARD_HEIGHT.horizontalThin;
            this.page.updateBlock(blockComponent.model, {
              style: 'horizontalThin',
              xywh: bound.serialize(),
            });
          }
        }

        return convertDragPreviewEdgelessToDoc({
          blockComponent,
          ...props,
        });
      } else if (isTargetEdgelessContainer) {
        let style = blockComponent.model.style ?? 'cubeThick';
        const embed = blockComponent.model.embed;
        if (embed) {
          style = 'cubeThick';
          this.page.updateBlock(blockComponent.model, {
            style,
            embed: false,
          });
        }

        return convertDragPreviewDocToEdgeless({
          blockComponent,
          cssSelector: '.affine-attachment-container',
          width: EMBED_CARD_WIDTH[style],
          height: EMBED_CARD_HEIGHT[style],
          ...props,
        });
      }

      return false;
    },
  };

  override connectedCallback() {
    super.connectedCallback();

    this.refreshData();

    this.contentEditable = 'false';

    const parent = this.host.page.getParent(this.model);
    this._isInSurface = parent?.flavour === 'affine:surface';

    if (!!this.model.caption && !!this.model.caption.length) {
      this.showCaption = true;
    }

    if (!this.model.style) {
      this.page.withoutTransact(() => {
        this.page.updateBlock(this.model, {
          style: AttachmentBlockStyles[1],
        });
      });
    }

    this.disposables.add(
      AffineDragHandleWidget.registerOption(this._dragHandleOption)
    );

    // Workaround for https://github.com/toeverything/blocksuite/issues/4724
    this._themeObserver.observe(document.documentElement);
    this._themeObserver.on(() => this.requestUpdate());
    this.disposables.add(() => this._themeObserver.dispose());

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

    // this is required to prevent iframe from capturing pointer events
    this.disposables.add(
      this.std.selection.slots.changed.on(sels => {
        this._isSelected = sels.some(sel =>
          PathFinder.equals(sel.path, this.path)
        );
        this._showOverlay = this._isDragging || !this._isSelected;
      })
    );
    // this is required to prevent iframe from capturing pointer events
    this.handleEvent('pointerMove', ctx => {
      this._isDragging = ctx.get('pointerState').dragging;
      if (this._isDragging) this._showOverlay = true;
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
    }
  }

  open = () => {
    if (!this.blobUrl) {
      return;
    }
    window.open(this.blobUrl, '_blank');
  };

  download = () => {
    downloadAttachmentBlob(this).catch(console.error);
  };

  refreshData = () => {
    checkAttachmentBlob(this).catch(console.error);
  };

  private _selectBlock() {
    const selectionManager = this.host.selection;
    const blockSelection = selectionManager.create('block', {
      path: this.path,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

  private _handleClick() {
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
      (blockSelections.length === 1 && blockSelections[0].path !== this.path)
    ) {
      return null;
    }

    return {
      template: AttachmentOptionsTemplate({
        anchor: this,
        model: this.model,
        showCaption: () => {
          this.showCaption = true;
          requestAnimationFrame(() => {
            this.captionElement.focus();
          });
        },
        downloadAttachment: this.download,
        abortController,
      }),
      computePosition: {
        referenceElement: this,
        placement: 'top-end',
        middleware: [flip(), offset(4)],
        autoUpdate: true,
      },
    };
  });

  override renderBlock() {
    const { name, size, style, caption } = this.model;
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

    return html`<div
      ${this.isInSurface ? null : ref(this._whenHover.setReference)}
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

      <embed-card-caption
        .block=${this}
        .display=${this.showCaption}
        @blur=${() => {
          if (!caption) this.showCaption = false;
        }}
      ></embed-card-caption>

      ${this.selected?.is('block')
        ? html`<affine-block-selection></affine-block-selection>`
        : nothing}
    </div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-attachment': AttachmentBlockComponent;
  }
}

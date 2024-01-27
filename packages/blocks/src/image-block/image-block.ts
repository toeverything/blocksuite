import './components/image-card.js';
import './components/page-image-block.js';
import './components/edgeless-image-block.js';
import '../_common/components/embed-card/embed-card-caption.js';
import '../_common/components/block-selection.js';

import { BlockElement } from '@blocksuite/lit';
import { html, nothing, render } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EmbedCardCaption } from '../_common/components/embed-card/embed-card-caption.js';
import {
  getEdgelessPageByElement,
  matchFlavours,
} from '../_common/utils/index.js';
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
import type { ImageBlockEdgelessComponent } from './components/edgeless-image-block.js';
import type { AffineImageCard } from './components/image-card.js';
import type { ImageBlockPageComponent } from './components/page-image-block.js';
import { type ImageBlockModel, ImageBlockSchema } from './image-model.js';
import { openLeditsEditor } from './ledits/main.js';
import {
  copyImageBlob,
  downloadImageBlob,
  fetchImageBlob,
  resetImageSize,
  turnImageIntoCardView,
} from './utils.js';

@customElement('affine-image')
export class ImageBlockComponent extends BlockElement<ImageBlockModel> {
  @property({ attribute: false })
  loading = false;

  @property({ attribute: false })
  error = false;

  @property({ attribute: false })
  downloading = false;

  @property({ attribute: false })
  retryCount = 0;

  @property({ attribute: false })
  blob?: Blob;

  @property({ attribute: false })
  blobUrl?: string;

  @query('affine-image-block-card')
  private _imageCard?: AffineImageCard;

  @query('affine-page-image')
  private _pageImage?: ImageBlockPageComponent;

  @query('affine-edgeless-image')
  private _edgelessImage?: ImageBlockEdgelessComponent;

  @query('embed-card-caption')
  captionElement!: EmbedCardCaption;

  private _isInSurface = false;

  get isInSurface() {
    return this._isInSurface;
  }

  get edgeless() {
    if (this._isInSurface) return null;
    return this.host.querySelector('affine-edgeless-page');
  }

  private get _imageElement() {
    const imageElement = this.isInSurface
      ? this._edgelessImage
      : this._pageImage;
    return imageElement;
  }

  get resizeImg() {
    return this._imageElement?.resizeImg;
  }

  get imageCard() {
    return this._imageCard;
  }

  private _dragHandleOption: DragHandleOption = {
    flavour: ImageBlockSchema.model.flavour,
    edgeless: true,
    onDragStart: ({ state, startDragging, anchorBlockPath }) => {
      const element = captureEventTarget(state.raw.target);
      if (element?.classList.contains('resize')) return false;

      if (!anchorBlockPath) return false;
      const anchorComponent = this.std.view.viewFromPath(
        'block',
        anchorBlockPath
      );
      if (
        !anchorComponent ||
        !matchFlavours(anchorComponent.model, [ImageBlockSchema.model.flavour])
      )
        return false;

      const blockComponent = anchorComponent as ImageBlockComponent;

      const isDraggingByDragHandle = !!element?.closest(
        AFFINE_DRAG_HANDLE_WIDGET
      );
      const isDraggingByComponent = blockComponent.contains(element);
      const isInSurface = blockComponent.isInSurface;

      if (!isInSurface && (isDraggingByDragHandle || isDraggingByComponent)) {
        this.std.selection.setGroup('note', [
          this.std.selection.create('block', {
            path: blockComponent.path,
          }),
        ]);
        startDragging([blockComponent], state);
        return true;
      } else if (isInSurface && isDraggingByDragHandle) {
        const edgelessPage = getEdgelessPageByElement(blockComponent);
        const scale = edgelessPage ? edgelessPage.service.viewport.zoom : 1;
        const width = blockComponent.getBoundingClientRect().width;

        const dragPreviewEl = document.createElement('div');
        dragPreviewEl.classList.add('affine-block-element');
        dragPreviewEl.style.border = '2px solid var(--affine-border-color)';
        dragPreviewEl.style.borderRadius = '4px';
        dragPreviewEl.style.overflow = 'hidden';
        dragPreviewEl.style.width = `${width / scale}px`;
        render(blockComponent.renderModel(blockComponent.model), dragPreviewEl);

        startDragging([blockComponent], state, dragPreviewEl);
        return true;
      }
      return false;
    },
    onDragEnd: props => {
      const { state, draggingElements } = props;
      if (
        draggingElements.length !== 1 ||
        !matchFlavours(draggingElements[0].model, [
          ImageBlockSchema.model.flavour,
        ])
      )
        return false;

      const blockComponent = draggingElements[0] as ImageBlockComponent;
      const isInSurface = blockComponent.isInSurface;
      const target = captureEventTarget(state.raw.target);
      const isTargetEdgelessContainer =
        target?.classList.contains('edgeless') &&
        target?.classList.contains('affine-block-children-container');

      if (isInSurface) {
        return convertDragPreviewEdgelessToDoc({
          blockComponent,
          ...props,
        });
      } else if (isTargetEdgelessContainer) {
        return convertDragPreviewDocToEdgeless({
          blockComponent,
          cssSelector: '.drag-target',
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

    this.model.propsUpdated.on(({ key }) => {
      if (key === 'sourceId') {
        this.refreshData();
      }
    });

    this.disposables.add(
      AffineDragHandleWidget.registerOption(this._dragHandleOption)
    );
  }

  override disconnectedCallback() {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
    }
    super.disconnectedCallback();
  }

  openEditor = () => {
    openLeditsEditor(this);
  };

  copy = () => {
    copyImageBlob(this).catch(console.error);
  };

  download = () => {
    downloadImageBlob(this).catch(console.error);
  };

  refreshData = () => {
    this.retryCount = 0;
    fetchImageBlob(this)
      .then(() => {
        // add width, height to model to show scale percent
        const { width, height } = this.model;
        if (this.isInSurface && !width && !height) {
          this.resetImageSize();
        }
      })
      .catch(console.error);
  };

  resetImageSize = () => {
    resetImageSize(this).catch(console.error);
  };

  convertToCardView = () => {
    turnImageIntoCardView(this);
  };

  private _selectBlock() {
    const selectionManager = this.host.selection;
    const blockSelection = selectionManager.create('block', {
      path: this.path,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

  private _handleClick(event: MouseEvent) {
    event.stopPropagation();
    if (!this.isInSurface) {
      this._selectBlock();
    }
  }

  override updated() {
    this._imageCard?.requestUpdate();
    this._imageElement?.requestUpdate();
  }

  override renderBlock() {
    let containerStyleMap = styleMap({
      position: 'relative',
      width: '100%',
      margin: '18px 0px',
    });

    if (this.isInSurface) {
      const bound = Bound.deserialize(
        (this.edgeless?.service.getElementById(this.model.id) ?? this.model)
          .xywh
      );
      const width = this.model.width ? this.model.width : bound.w;
      const height = this.model.height ? this.model.height : bound.h;
      const scaleX = bound.w / width;
      const scaleY = bound.h / height;
      containerStyleMap = styleMap({
        width: `${width}px`,
        height: `${height}px`,
        transform: `scale(${scaleX}, ${scaleY})`,
        transformOrigin: '0 0',
      });
    }

    return html`<div
      class="affine-image-container"
      style=${containerStyleMap}
      @click=${this._handleClick}
    >
      ${this.loading || this.error
        ? html`<affine-image-block-card
            .block=${this}
          ></affine-image-block-card>`
        : this.isInSurface
          ? html`<affine-edgeless-image .block=${this}></affine-edgeless-image>`
          : html`<affine-page-image .block=${this}></affine-page-image>`}

      <embed-card-caption .block=${this}></embed-card-caption>

      ${this.selected?.is('block')
        ? html`<affine-block-selection></affine-block-selection>`
        : nothing}
      ${this.isInSurface ? null : Object.values(this.widgets)}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-image': ImageBlockComponent;
  }
}

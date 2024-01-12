import './doc-image-block.js';
import './edgeless-image-block.js';
import './components/image-card.js';

import { BlockElement } from '@blocksuite/lit';
import { html, render } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import {
  getEdgelessPageByElement,
  matchFlavours,
} from '../_common/utils/index.js';
import type { DragHandleOption } from '../page-block/widgets/drag-handle/config.js';
import { AffineDragHandleWidget } from '../page-block/widgets/drag-handle/drag-handle.js';
import {
  captureEventTarget,
  convertDragPreviewDocToEdgeless,
  convertDragPreviewEdgelessToDoc,
} from '../page-block/widgets/drag-handle/utils.js';
import { ImageState } from './components/image-card.js';
import type { ImageBlockPageComponent } from './doc-image-block.js';
import type { ImageBlockEdgelessComponent } from './edgeless-image-block.js';
import { type ImageBlockModel, ImageBlockSchema } from './image-model.js';
import { isImageLoading } from './utils.js';

const MAX_RETRY_COUNT = 3;

@customElement('affine-image')
export class ImageBlockComponent extends BlockElement<ImageBlockModel> {
  @query('affine-page-image')
  _pageImage!: ImageBlockPageComponent;

  @query('affine-edgeless-image')
  _edgelessImage!: ImageBlockEdgelessComponent;

  @state()
  private _imageState: ImageState = ImageState.Loading;

  private _isInSurface = false;
  private _lastSourceId: string = '';
  private _source: string = '';
  private _retryCount = 0;

  blob?: Blob;

  get isInSurface() {
    return this._isInSurface;
  }

  get resizeImg() {
    return this._pageImage.resizeImg;
  }

  private _fetchImage = () => {
    if (isImageLoading(this.model.id)) {
      this._retryCount = 0;
      return;
    }

    if (!this.model.sourceId) {
      this._imageState = ImageState.Failed;
      return;
    }

    if (
      this._imageState === ImageState.Ready &&
      this._lastSourceId &&
      this._lastSourceId === this.model.sourceId
    ) {
      return;
    }

    this._imageState = ImageState.Loading;
    const storage = this.model.page.blob;
    const sourceId = this.model.sourceId;
    storage
      .get(sourceId)
      .then(blob => {
        if (blob) {
          this.blob = blob;
          this._source = URL.createObjectURL(blob);
          this._lastSourceId = sourceId;
          this._imageState = ImageState.Ready;
        } else {
          throw new Error('Cannot find blob');
        }
      })
      .catch(e => {
        this._retryCount++;
        console.warn('Cannot find blob, retrying', this._retryCount);

        if (this._retryCount < MAX_RETRY_COUNT) {
          setTimeout(() => {
            this._fetchImage();
            // 1s, 2s, 3s
          }, 1000 * this._retryCount);
        } else {
          console.error(e);
          this._imageState = ImageState.Failed;
        }
      });
  };

  private _onCardClick(e: Event) {
    e.stopPropagation();

    const selection = this.host.selection;
    selection.setGroup('note', [
      selection.create('block', { path: this.path }),
    ]);
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
      const isInSurface = blockComponent.isInSurface;
      if (!isInSurface) {
        this.std.selection.setGroup('note', [
          this.std.selection.create('block', {
            path: blockComponent.path,
          }),
        ]);
        startDragging([blockComponent], state);
        return true;
      }

      const insideDragHandle = !!element?.closest('affine-drag-handle-widget');
      if (!insideDragHandle) return false;

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
          cssSelector: 'img',
          ...props,
        });
      }
      return false;
    },
  };

  override connectedCallback() {
    super.connectedCallback();

    this.disposables.add(
      AffineDragHandleWidget.registerOption(this._dragHandleOption)
    );

    const parent = this.host.page.getParent(this.model);
    this._isInSurface = parent?.flavour === 'affine:surface';

    this._fetchImage();

    this.model.propsUpdated.on(({ key }) => {
      if (key === 'sourceId') {
        if (this._source) {
          URL.revokeObjectURL(this._source);
          this._source = '';
        }
        this._retryCount = 0;
        this._fetchImage();
      }
    });
  }

  override disconnectedCallback() {
    if (this._source) URL.revokeObjectURL(this._source);

    super.disconnectedCallback();
  }

  override render() {
    const imageState = isImageLoading(this.model.id)
      ? ImageState.Loading
      : this._imageState;

    if (imageState !== ImageState.Ready) {
      return html`<affine-image-block-card
        imageState=${imageState}
        ?isinsurface=${this.isInSurface}
        imageSize=${ifDefined(this.model.size)}
        @click=${this._onCardClick}
      ></affine-image-block-card>`;
    }

    if (this.isInSurface) {
      return html`<affine-edgeless-image
        .model=${this.model}
        .page=${this.page}
        .host=${this.host}
        .widgets=${this.widgets}
        source=${this._source}
      ></affine-edgeless-image>`;
    } else {
      return html`<affine-page-image
        .model=${this.model}
        .page=${this.page}
        .host=${this.host}
        .widgets=${this.widgets}
        source=${this._source}
      ></affine-page-image>`;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-image': ImageBlockComponent;
  }
}

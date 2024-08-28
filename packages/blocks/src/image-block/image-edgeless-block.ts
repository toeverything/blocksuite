import type { BlockCaptionEditor } from '@blocksuite/affine-components/caption';
import type { ImageBlockModel } from '@blocksuite/affine-model';

import { Peekable } from '@blocksuite/affine-components/peek';
import { GfxBlockComponent } from '@blocksuite/block-std';
import { deserializeXYWH, serializeXYWH } from '@blocksuite/global/utils';
import { css, html } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { when } from 'lit/directives/when.js';

import type {
  EdgelessElementToolbarWidget,
  EdgelessRootBlockComponent,
} from '../root-block/index.js';
import type { ImageBlockFallbackCard } from './components/image-block-fallback.js';
import type CropperCanvas from './cropperjs/canvas.js';
import type CropperSelection from './cropperjs/selection.js';
import type { ImageBlockService } from './image-service.js';

import { EDGELESS_ELEMENT_TOOLBAR_WIDGET } from '../root-block/widgets/element-toolbar/index.js';
import { Cropper } from './cropperjs/index.js';
import {
  copyImageBlob,
  downloadImageBlob,
  fetchImageBlob,
  resetImageSize,
  turnImageIntoCardView,
} from './utils.js';

type CropperXywh = { x: number; y: number; width: number; height: number };

@Peekable()
export class ImageEdgelessBlockComponent extends GfxBlockComponent<
  ImageBlockModel,
  ImageBlockService
> {
  static override styles = css`
    affine-edgeless-image .resizable-img,
    affine-edgeless-image .resizable-img img {
      width: 100%;
      height: 100%;
    }
  `;

  cleanupCrop = () => {
    this.cropping = false;
    this.resizableImg.style.removeProperty('height');
    this.resizableImg.style.removeProperty('width');
    document
      .querySelector('affine-edgeless-root')
      ?.slots.croppingStatusUpdated.emit(false);
    const toolbar = this.std.host.view.getWidget(
      EDGELESS_ELEMENT_TOOLBAR_WIDGET,
      this.doc.root?.id ?? ''
    ) as EdgelessElementToolbarWidget | null;
    if (toolbar) toolbar.disableOtherButtons = false;
    const selectedRect = (this.rootComponent as EdgelessRootBlockComponent)
      .selectedRect;
    if (selectedRect) selectedRect.style.removeProperty('display');
    this.querySelector('cropper-canvas')?.remove();
    const imgEle = this.resizableImg.querySelector('img') as HTMLImageElement;
    imgEle.style.removeProperty('display');
  };

  convertToCardView = () => {
    turnImageIntoCardView(this).catch(console.error);
  };

  copy = () => {
    copyImageBlob(this).catch(console.error);
  };

  crop = async () => {
    const cropper = this.querySelector('cropper-selection') as CropperSelection;
    if (!cropper) return;
    const canvas = await cropper.$toCanvas({
      width: this.clientWidth,
      height: this.clientHeight,
    });
    const blob = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(blob => resolve(blob));
    });
    if (!blob) return;
    const sourceId = await this.doc.blobSync.set(blob);
    this.doc.transact(() => {
      this.model.sourceId = sourceId;
      this.model.width = undefined;
      this.model.height = undefined;
    });
    this.cleanupCrop();
    queueMicrotask(() => {
      this.refreshData();
      this.doc.transact(() => {
        const bound = deserializeXYWH(this.model.xywh);
        this.model.xywh = serializeXYWH(
          bound[0],
          bound[1],
          canvas.width,
          canvas.height
        );
      });
    });
  };

  download = () => {
    downloadImageBlob(this).catch(console.error);
  };

  refreshData = () => {
    this.retryCount = 0;
    fetchImageBlob(this)
      .then(() => {
        const { width, height } = this.model;
        if (!width || !height) {
          return resetImageSize(this);
        }

        return;
      })
      .catch(console.error);
  };

  startCrop = async () => {
    const imgEle = this.resizableImg.querySelector('img') as HTMLImageElement;
    if (this.cropping || !imgEle) return;
    this.cropping = true;
    document
      .querySelector('affine-edgeless-root')
      ?.slots.croppingStatusUpdated.emit(true);
    this.resizableImg.style.height = `${this.clientHeight}px`;
    this.resizableImg.style.width = `${this.clientWidth}px`;
    const cropper = new Cropper(imgEle, this.blockId);
    const cropperCanvas = cropper.getCropperCanvas() as CropperCanvas;
    cropperCanvas.style.height = `100%`;
    const toolbar = this.std.host.view.getWidget(
      EDGELESS_ELEMENT_TOOLBAR_WIDGET,
      this.doc.root?.id ?? ''
    ) as EdgelessElementToolbarWidget | null;
    if (toolbar) toolbar.disableOtherButtons = true;
    const selectedRect = (this.rootComponent as EdgelessRootBlockComponent)
      .selectedRect;
    if (selectedRect) selectedRect.style.display = 'none';
    const cropperImage = cropper.getCropperImage();
    if (!cropperImage) {
      this.cleanupCrop();
      return;
    }
    await cropperImage.$ready();
    queueMicrotask(() => {
      cropperImage.style.height = `100%`;
      cropperImage.style.width = `100%`;
      cropperImage.$center();
      const cropperSelection = cropper.getCropperSelection();
      if (!cropperSelection) {
        this.cleanupCrop();
        return;
      }
      cropperSelection.addEventListener('change', event => {
        const { detail } = event as CustomEvent;
        const maxSelection = {
          x: 0,
          y: 0,
          width: cropperCanvas.clientWidth,
          height: cropperCanvas.clientHeight,
        };
        if (!this._inSelection(detail, maxSelection)) {
          event.preventDefault();
        }
      });
    });
  };

  private _handleError(error: Error) {
    this.dispatchEvent(new CustomEvent('error', { detail: error }));
  }

  private _inSelection(selection: CropperSelection, maxSelection: CropperXywh) {
    return (
      selection.x >= maxSelection.x &&
      selection.y >= maxSelection.y &&
      selection.x + selection.width <= maxSelection.x + maxSelection.width &&
      selection.y + selection.height <= maxSelection.y + maxSelection.height
    );
  }

  override connectedCallback() {
    super.connectedCallback();

    this.refreshData();
    this.contentEditable = 'false';
    this.model.propsUpdated.on(({ key }) => {
      if (key === 'sourceId') {
        this.refreshData();
      }
    });
  }

  override disconnectedCallback() {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
    }
    super.disconnectedCallback();
  }

  override renderGfxBlock() {
    const containerStyleMap = styleMap({
      position: 'relative',
      width: '100%',
    });

    return html`
      <div class="affine-image-container" style=${containerStyleMap}>
        ${when(
          this.loading || this.error || !this.blobUrl,
          () =>
            html`<affine-image-fallback-card
              .error=${this.error}
              .loading=${this.loading}
              .mode=${'page'}
            ></affine-image-fallback-card>`,
          () =>
            html`<div class="resizable-img">
              <img
                class="drag-target"
                src=${this.blobUrl ?? ''}
                draggable="false"
                @error=${this._handleError}
              />
            </div>`
        )}
        <affine-block-selection .block=${this}></affine-block-selection>
      </div>
      <block-caption-editor></block-caption-editor>

      ${Object.values(this.widgets)}
    `;
  }

  override updated() {
    this.fallbackCard?.requestUpdate();
  }

  @property({ attribute: false })
  accessor blob: Blob | undefined = undefined;

  @property({ attribute: false })
  accessor blobUrl: string | undefined = undefined;

  @query('block-caption-editor')
  accessor captionEditor!: BlockCaptionEditor | null;

  @property({ attribute: false })
  accessor cropping = false;

  @property({ attribute: false })
  accessor downloading = false;

  @property({ attribute: false })
  accessor error = false;

  @query('affine-image-fallback-card')
  accessor fallbackCard: ImageBlockFallbackCard | null = null;

  @state()
  accessor lastSourceId!: string;

  @property({ attribute: false })
  accessor loading = false;

  @query('.resizable-img')
  accessor resizableImg!: HTMLDivElement;

  @property({ attribute: false })
  accessor retryCount = 0;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-image': ImageEdgelessBlockComponent;
  }
}

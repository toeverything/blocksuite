import type { ImageBlockModel } from '@blocksuite/affine-model';

import { Peekable } from '@blocksuite/affine-components/peek';
import { Bound } from '@blocksuite/global/utils';
import { html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessRootService } from '../root-block/index.js';
import type { ImageBlockEdgelessComponent } from './components/edgeless-image-block.js';
import type { AffineImageCard } from './components/image-card.js';
import type { ImageBlockPageComponent } from './components/page-image-block.js';
import type { ImageBlockService } from './image-service.js';

import { CaptionedBlockComponent } from '../_common/components/captioned-block-component.js';
import './components/edgeless-image-block.js';
import './components/image-card.js';
import './components/page-image-block.js';
import {
  copyImageBlob,
  downloadImageBlob,
  fetchImageBlob,
  resetImageSize,
  turnImageIntoCardView,
} from './utils.js';

@customElement('affine-image')
@Peekable()
export class ImageBlockComponent extends CaptionedBlockComponent<
  ImageBlockModel,
  ImageBlockService
> {
  private _isInSurface = false;

  convertToCardView = () => {
    turnImageIntoCardView(this).catch(console.error);
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

  private _handleClick(event: MouseEvent) {
    // the peek view need handle shift + click
    if (event.shiftKey) return;

    event.stopPropagation();
    if (!this.isInSurface) {
      this._selectBlock();
    }
  }

  private get _imageElement() {
    const imageElement = this.isInSurface
      ? this._edgelessImage
      : this._pageImage;
    return imageElement;
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

    this.refreshData();

    this.contentEditable = 'false';

    const parent = this.host.doc.getParent(this.model);
    this._isInSurface = parent?.flavour === 'affine:surface';

    this.blockContainerStyles = this._isInSurface
      ? undefined
      : { margin: '18px 0' };

    this.model.propsUpdated.on(({ key }) => {
      if (key === 'sourceId') {
        this.refreshData();
      }
    });

    if (this._isInSurface) {
      this.style.position = 'absolute';
      this.style.transformOrigin = 'center';
    }
  }

  override disconnectedCallback() {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
    }
    super.disconnectedCallback();
  }

  override renderBlock() {
    const containerStyleMap = styleMap({
      position: 'relative',
      width: '100%',
    });

    if (this.isInSurface) {
      const { xywh, rotate } = this.model;
      const bound = Bound.deserialize(xywh);

      this.style.left = `${bound.x}px`;
      this.style.top = `${bound.y}px`;
      this.style.width = `${bound.w}px`;
      this.style.height = `${bound.h}px`;
      this.style.transform = `rotate(${rotate}deg)`;
      this.style.zIndex = `${this.toZIndex()}`;
    }

    return html`
      <div
        class="affine-image-container"
        style=${containerStyleMap}
        @click=${this._handleClick}
      >
        ${this.loading || this.error
          ? html`<affine-image-block-card
              .block=${this}
            ></affine-image-block-card>`
          : this.isInSurface
            ? html`<affine-edgeless-image
                .url=${this.blobUrl}
                @error=${(_: CustomEvent<Error>) => {
                  this.error = true;
                }}
              ></affine-edgeless-image>`
            : html`<affine-page-image .block=${this}></affine-page-image>`}
      </div>

      ${this.isInSurface ? nothing : Object.values(this.widgets)}
    `;
  }

  toZIndex() {
    return this.rootService?.layer.getZIndex(this.model) ?? 1;
  }

  updateZIndex() {
    this.style.zIndex = `${this.toZIndex()}`;
  }

  override updated() {
    this._imageCard?.requestUpdate();
  }

  get imageCard() {
    return this._imageCard;
  }

  get isInSurface() {
    return this._isInSurface;
  }

  get resizeImg() {
    return this._imageElement?.resizeImg;
  }

  get rootService() {
    const service = this.std.spec.getService('affine:page');

    if (!('surface' in service)) {
      return null;
    }

    return service as unknown as EdgelessRootService;
  }

  @query('affine-edgeless-image')
  private accessor _edgelessImage: ImageBlockEdgelessComponent | null = null;

  @query('affine-image-block-card')
  private accessor _imageCard: AffineImageCard | null = null;

  @query('affine-page-image')
  private accessor _pageImage: ImageBlockPageComponent | null = null;

  @property({ attribute: false })
  accessor blob: Blob | undefined = undefined;

  @property({ attribute: false })
  accessor blobUrl: string | undefined = undefined;

  @property({ attribute: false })
  accessor downloading = false;

  @property({ attribute: false })
  accessor error = false;

  @state()
  accessor lastSourceId!: string;

  @property({ attribute: false })
  accessor loading = false;

  @property({ attribute: false })
  accessor retryCount = 0;

  override accessor useCaptionEditor = true;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-image': ImageBlockComponent;
  }
}

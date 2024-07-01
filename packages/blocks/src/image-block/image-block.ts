import './components/image-card.js';
import './components/page-image-block.js';
import './components/edgeless-image-block.js';

import { html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { BlockComponent } from '../_common/components/block-component.js';
import { Peekable } from '../_common/components/index.js';
import { Bound } from '../surface-block/utils/bound.js';
import type { ImageBlockEdgelessComponent } from './components/edgeless-image-block.js';
import type { AffineImageCard } from './components/image-card.js';
import type { ImageBlockPageComponent } from './components/page-image-block.js';
import type { ImageBlockModel } from './image-model.js';
import type { ImageBlockService } from './image-service.js';
import {
  copyImageBlob,
  downloadImageBlob,
  fetchImageBlob,
  resetImageSize,
  turnImageIntoCardView,
} from './utils.js';

@customElement('affine-image')
@Peekable()
export class ImageBlockComponent extends BlockComponent<
  ImageBlockModel,
  ImageBlockService
> {
  get isInSurface() {
    return this._isInSurface;
  }

  get edgeless() {
    if (!this._isInSurface) {
      return null;
    }
    return this.host.querySelector('affine-edgeless-root');
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

  @query('affine-image-block-card')
  private accessor _imageCard: AffineImageCard | null = null;

  @query('affine-page-image')
  private accessor _pageImage: ImageBlockPageComponent | null = null;

  @query('affine-edgeless-image')
  private accessor _edgelessImage: ImageBlockEdgelessComponent | null = null;

  private _isInSurface = false;

  override accessor useCaptionEditor = true;

  @property({ attribute: false })
  accessor loading = false;

  @property({ attribute: false })
  accessor error = false;

  @property({ attribute: false })
  accessor downloading = false;

  @property({ attribute: false })
  accessor retryCount = 0;

  @property({ attribute: false })
  accessor blob: Blob | undefined = undefined;

  @property({ attribute: false })
  accessor blobUrl: string | undefined = undefined;

  @state()
  accessor lastSourceId!: string;

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
    turnImageIntoCardView(this).catch(console.error);
  };

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
  }

  override disconnectedCallback() {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
    }
    super.disconnectedCallback();
  }

  override updated() {
    this._imageCard?.requestUpdate();
  }

  override renderBlock() {
    let containerStyleMap = styleMap({
      position: 'relative',
      width: '100%',
    });

    if (this.isInSurface) {
      const { id, xywh, rotate } = this.model;
      const bound = Bound.deserialize(
        this.edgeless?.service.getElementById(id)?.xywh ?? xywh
      );
      containerStyleMap = styleMap({
        width: `${bound.w}px`,
        height: `${bound.h}px`,
        transform: `rotate(${rotate}deg)`,
        transformOrigin: 'center',
      });
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
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-image': ImageBlockComponent;
  }
}

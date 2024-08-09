import { html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { when } from 'lit/directives/when.js';

import type { ImageBlockFallback } from './components/image-block-fallback.js';
import type { ImageBlockPageComponent } from './components/page-image-block.js';
import type { ImageBlockModel } from './image-model.js';
import type { ImageBlockService } from './image-service.js';

import { CaptionedBlockComponent } from '../_common/components/captioned-block-component.js';
import { Peekable } from '../_common/components/index.js';
import './components/edgeless-image-block.js';
import './components/image-block-fallback.js';
import './components/page-image-block.js';
import {
  copyImageBlob,
  downloadImageBlob,
  fetchImageBlob,
  turnImageIntoCardView,
} from './utils.js';

@customElement('affine-edgeless-image')
@Peekable()
export class ImageBlockEdgelessComponent extends CaptionedBlockComponent<
  ImageBlockModel,
  ImageBlockService
> {
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
    fetchImageBlob(this).catch(console.error);
  };

  private _handleClick(event: MouseEvent) {
    // the peek view need handle shift + click
    if (event.shiftKey) return;

    event.stopPropagation();
    const selectionManager = this.host.selection;
    const blockSelection = selectionManager.create('block', {
      blockId: this.blockId,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

  private get _imageElement() {
    return this._pageImage;
  }

  override connectedCallback() {
    super.connectedCallback();

    this.contentEditable = 'false';
    this.blockContainerStyles = { margin: '18px 0' };
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

  override renderBlock() {
    const containerStyleMap = styleMap({
      position: 'relative',
      width: '100%',
    });

    return html`
      <div
        class="affine-image-container"
        style=${containerStyleMap}
        @click=${this._handleClick}
      >
        ${when(
          this.loading || this.error,
          () =>
            html`<affine-image-block-fallback
              .error=${this.error}
              .loading=${this.loading}
              .mode=${'page'}
              .model=${this.model}
            ></affine-image-block-fallback>`,
          () => html`<affine-page-image .block=${this}></affine-page-image>`
        )}
      </div>

      ${Object.values(this.widgets)}
    `;
  }

  override updated() {
    this._imageCard?.requestUpdate();
  }

  get imageCard() {
    return this._imageCard;
  }

  get resizeImg() {
    return this._imageElement?.resizeImg;
  }

  @query('affine-image-block-card')
  private accessor _imageCard: ImageBlockFallback | null = null;

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
    'affine-edgeless-image': ImageBlockEdgelessComponent;
  }
}

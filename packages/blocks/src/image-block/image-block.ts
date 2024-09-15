import type { ImageBlockModel } from '@blocksuite/affine-model';

import { CaptionedBlockComponent } from '@blocksuite/affine-components/caption';
import { Peekable } from '@blocksuite/affine-components/peek';
import { html } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { when } from 'lit/directives/when.js';

import type { ImageBlockFallbackCard } from './components/image-block-fallback.js';
import type { ImageBlockPageComponent } from './components/page-image-block.js';
import type { ImageBlockService } from './image-service.js';

import {
  copyImageBlob,
  downloadImageBlob,
  fetchImageBlob,
  turnImageIntoCardView,
} from './utils.js';

@Peekable()
export class ImageBlockComponent extends CaptionedBlockComponent<
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

  get resizableImg() {
    return this.pageImage?.resizeImg;
  }

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
            html`<affine-image-fallback-card
              .error=${this.error}
              .loading=${this.loading}
              .mode=${'page'}
            ></affine-image-fallback-card>`,
          () => html`<affine-page-image .block=${this}></affine-page-image>`
        )}
      </div>

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

  override accessor blockContainerStyles = { margin: '18px 0' };

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

  @query('affine-page-image')
  private accessor pageImage: ImageBlockPageComponent | null = null;

  @property({ attribute: false })
  accessor retryCount = 0;

  override accessor useCaptionEditor = true;

  override accessor useZeroWidth = true;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-image': ImageBlockComponent;
  }
}

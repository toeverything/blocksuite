import './placeholder/loading-card.js';
import './placeholder/image-not-found.js';

import type { Disposable } from '@blocksuite/global/utils';
import { assertExists } from '@blocksuite/global/utils';
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import {
  type BlockHost,
  NonShadowLitElement,
} from '../../__internal__/index.js';
import { BlockChildrenContainer } from '../../__internal__/service/components.js';
import type { EmbedBlockModel } from '../index.js';

@customElement('affine-image')
export class ImageBlockComponent extends NonShadowLitElement {
  static styles = css`
    .affine-image-wrapper {
      padding: 8px;
      width: 100%;
      text-align: center;
      line-height: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-top: calc(var(--affine-paragraph-space) + 8px);
    }
    .affine-image-wrapper img {
      max-width: 100%;
      margin: auto;
      width: 100%;
    }

    .resizable {
      max-width: 100%;
      /* text-align: center; */
    }
    /* .resizable:hover {
      border: 2px solid #4286f4;
    } */
    .active .resizable {
      border: 1px solid var(--affine-primary-color) !important;
    }
    .resizable .image-option-container {
      display: none;
      position: absolute;
      top: 4px;
      right: -52px;
      margin: 0;
      padding-left: 12px;
    }

    .embed-editing-state {
      box-shadow: 0 1px 10px -6px rgba(24, 39, 75, 0.8),
        0 3px 16px -6px rgba(24, 39, 75, 0.4);
      border-radius: 10px;
      list-style: none;
      padding: 4px;
      width: 40px;
      background-color: var(--affine-page-background);
      margin: 0;
    }

    .resizable .resizes {
      /* width: 100%; */
      height: 100%;
      box-sizing: border-box;
      line-height: 0;
    }

    .resizable .resizes .resize {
      /* display: none; */
      width: 10px;
      height: 10px;
      border-radius: 50%; /*magic to turn square into circle*/
      background: white;
      border: 2px solid var(--affine-primary-color);
      position: absolute;
    }

    .resizable:hover .resize {
      display: block;
    }
    .active .resize {
      display: block !important;
    }
    .resizable .resizes .resize.top-left {
      left: -5px;
      top: -5px;
      cursor: nwse-resize; /*resizer cursor*/
    }
    .resizable .resizes .resize.top-right {
      right: -5px;
      top: -5px;
      cursor: nesw-resize;
    }
    .resizable .resizes .resize.bottom-left {
      left: -5px;
      bottom: -5px;
      cursor: nesw-resize;
    }
    .resizable .resizes .resize.bottom-right {
      right: -5px;
      bottom: -5px;
      cursor: nwse-resize;
    }

    .resizable-img {
      border: 1px solid var(--affine-page-background);
    }
    .resizable-img:hover {
      border: 1px solid var(--affine-primary-color);
    }

    .resizable-img img {
      width: 100%;
    }
  `;

  @property()
  model!: EmbedBlockModel;

  @property()
  host!: BlockHost;

  @query('.resizable-img')
  public readonly resizeImg!: HTMLElement;

  @state()
  private _source!: string;

  private _imageReady: Disposable = {
    dispose: () => {
      return;
    },
  };

  @state()
  private _imageState: 'waitUploaded' | 'loading' | 'ready' | 'failed' =
    'loading';

  private waitImageUploaded() {
    return new Promise<void>(resolve => {
      // If we could not get message from awareness in 1000ms,
      // we assume this image is not found.
      const timer = setTimeout(resolve, 2000);

      const isBlobUploadingOnInit =
        this.model.page.awarenessStore.isBlobUploading(this.model.sourceId);

      const disposeSlot = this.model.page.awarenessStore.slots.update.on(() => {
        const isBlobUploading = this.model.page.awarenessStore.isBlobUploading(
          this.model.sourceId
        );

        /**
         * case:
         * clientA send image, but network latency is high,
         * clientB got ydoc, but doesn't get awareness,
         * clientC has a good network, and send awareness because of cursor changed,
         * clientB receives awareness change from clientC,
         * this listener will be called,
         * but clientB doesn't get uploading state from clientA.
         */
        if (
          isBlobUploadingOnInit === isBlobUploading &&
          isBlobUploading === false
        ) {
          return;
        }

        if (!isBlobUploading) {
          clearTimeout(timer);
          resolve();
        }
      });

      this._imageReady.dispose = () => {
        disposeSlot.dispose();
        clearTimeout(timer);
        resolve();
      };
    });
  }

  async firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
    // exclude padding and border width
    const { width, height } = this.model;
    const storage = await this.model.page.blobs;
    assertExists(storage);

    this._imageState = 'loading';
    let url = await storage.get(this.model.sourceId);
    if (!url) {
      this._imageState = 'waitUploaded';
      await this.waitImageUploaded();
      this._imageState = 'loading';
      url = await storage.get(this.model.sourceId);
    }
    if (url) {
      this._source = url;
      this._imageState = 'ready';
    } else {
      this._imageState = 'failed';
    }
    if (width && height) {
      this.resizeImg.style.width = width + 'px';
      this.resizeImg.style.height = height + 'px';
    }
  }

  render() {
    const childrenContainer = BlockChildrenContainer(
      this.model,
      this.host,
      () => this.requestUpdate()
    );
    const { width, height } = this.model;

    if (this.resizeImg) {
      if (this._imageState !== 'ready') {
        this.resizeImg.style.width = 'unset';
        this.resizeImg.style.height = 'unset';
      } else if (width && height) {
        this.resizeImg.style.width = width + 'px';
        this.resizeImg.style.height = height + 'px';
      } else {
        this.resizeImg.style.width = 'unset';
        this.resizeImg.style.height = 'unset';
      }
    }

    const img = {
      waitUploaded: html`<affine-image-block-loading-card
        content="Delivering content..."
      ></affine-image-block-loading-card>`,
      loading: html`<affine-image-block-loading-card
        content="Loading content..."
      ></affine-image-block-loading-card>`,
      ready: html`<img src=${this._source} />`,
      failed: html`<affine-image-block-not-found-card></affine-image-block-not-found-card>`,
    }[this._imageState];

    // For the first list item, we need to add a margin-top to make it align with the text
    // const shouldAddMarginTop = index === 0 && deep === 0;
    return html`
      <affine-embed .model=${this.model}>
        <div class="affine-image-wrapper">
          <div class="resizable-img">${img}</div>
          ${childrenContainer}
        </div>
      </affine-embed>
    `;
  }

  disconnectedCallback() {
    this._imageReady.dispose();
    super.disconnectedCallback();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-image': ImageBlockComponent;
  }
}

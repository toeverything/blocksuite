import './placeholder/loading-card.js';
import './placeholder/image-not-found.js';

import type { Disposable } from '@blocksuite/global/utils';
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { type BlockHost, ShadowlessElement } from '../../__internal__/index.js';
import { BlockChildrenContainer } from '../../__internal__/service/components.js';
import type { EmbedBlockModel } from '../index.js';

@customElement('affine-image')
export class ImageBlockComponent extends ShadowlessElement {
  static override styles = css`
    affine-image > affine-embed {
      display: block;
    }
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
    }

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
      background-color: var(--affine-white-90);
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
      border: 1px solid var(--affine-white-90);
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
  private _imageState: 'loading' | 'ready' | 'failed' = 'loading';

  override async firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
    // exclude padding and border width
    const { width, height } = this.model;
    const storage = this.model.page.blobs;

    this._imageState = 'loading';
    const timeout = 2000;
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      setTimeout(() => reject(new Error('timeout')), timeout);
      storage.get(this.model.sourceId).then(blob => {
        resolve(blob);
      });
    }).catch(() => null);
    if (blob) {
      this._source = URL.createObjectURL(blob);
      this._imageState = 'ready';
    } else {
      this._imageState = 'failed';
    }
    if (width && height) {
      this.resizeImg.style.width = width + 'px';
      this.resizeImg.style.height = height + 'px';
    }
  }

  override render() {
    const childrenContainer = BlockChildrenContainer(
      this.model,
      this.host,
      () => this.requestUpdate()
    );

    const resizeImgStyle = {
      width: 'unset',
      height: 'unset',
    };
    const { width, height } = this.model;
    if (width && height) {
      resizeImgStyle.width = `${width}px`;
      resizeImgStyle.height = `${height}px`;
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
          <div class="resizable-img" style=${styleMap(resizeImgStyle)}>
            ${img}
          </div>
          ${childrenContainer}
        </div>
      </affine-embed>
    `;
  }

  override disconnectedCallback() {
    this._imageReady.dispose();
    super.disconnectedCallback();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-image': ImageBlockComponent;
  }
}

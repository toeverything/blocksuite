import './placeholder/loading-card.js';
import './placeholder/image-not-found.js';

import type { Disposable } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { Slot } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { getViewportElement } from '../../__internal__/utils/query.js';
import type { EmbedBlockModel } from '../index.js';
import { ImageOptionsTemplate } from './image-options.js';

@customElement('affine-image')
export class ImageBlockComponent extends WithDisposable(ShadowlessElement) {
  static override styles = css`
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
      box-shadow: var(--affine-shadow-2);
      border-radius: 10px;
      list-style: none;
      padding: 4px;
      width: 40px;
      background-color: var(--affine-background-overlay-panel-color);
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
      position: relative;
      border: 1px solid var(--affine-white-90);
    }
    .resizable-img:hover {
      border: 1px solid var(--affine-primary-color);
    }

    .resizable-img img {
      width: 100%;
    }

    /* hover area */
    .resizable-img::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 50px;
      height: 100%;
      transform: translateX(100%);
    }
  `;

  @property()
  model!: EmbedBlockModel;

  @query('.resizable-img')
  public readonly resizeImg!: HTMLElement;

  @state()
  private _source!: string;

  private _imageReady: Disposable = {
    dispose: () => {
      return;
    },
  };

  static maxRetryCount = 3;

  @state()
  private _imageState: 'waitUploaded' | 'loading' | 'ready' | 'failed' =
    'loading';

  private _retryCount = 0;

  private hoverState = new Slot<boolean>();

  @state()
  private _optionPosition: { x: number; y: number } | null = null;

  override async firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
    // exclude padding and border width
    const { width, height } = this.model;

    if (width && height) {
      this.resizeImg.style.width = width + 'px';
      this.resizeImg.style.height = height + 'px';
    }
  }

  private _fetchError = (e: unknown) => {
    // Do have the id but cannot find the blob
    //  this is probably because the blob is not uploaded yet
    this._imageState = 'waitUploaded';
    this._retryCount++;
    console.warn('Cannot find blob, retrying', this._retryCount);
    if (this._retryCount < ImageBlockComponent.maxRetryCount) {
      setTimeout(() => {
        this._fetchImage();
        // 1s, 2s, 3s
      }, 1000 * this._retryCount);
    } else {
      console.error(e);
      this._imageState = 'failed';
    }
  };

  private _fetchImage = () => {
    if (this._imageState === 'ready') {
      return;
    }
    const storage = this.model.page.blobs;
    storage
      .get(this.model.sourceId)
      .then(blob => {
        if (blob) {
          this._source = URL.createObjectURL(blob);
          this._imageState = 'ready';
        } else {
          this._fetchError(new Error('Cannot find blob'));
        }
      })
      .catch(this._fetchError);
  };

  override connectedCallback() {
    super.connectedCallback();
    this._imageState = 'loading';
    this._fetchImage();
    this._disposables.add(
      this.model.page.workspace.slots.blobUpdate.on(this._fetchImage)
    );
    // Wait for DOM to be ready
    setTimeout(() => this._observePosition());
  }

  override disconnectedCallback() {
    this._imageReady.dispose();
    if (this._source) {
      URL.revokeObjectURL(this._source);
    }
    super.disconnectedCallback();
  }

  private _observePosition() {
    // At AFFiNE, avoid the option element to be covered by the header
    // we need to reserve the space for the header
    const HEADER_HEIGHT = 64;
    // The height of the option element
    // You need to change this value manually if you change the style of the option element
    const OPTION_ELEMENT_HEIGHT = 136;
    const HOVER_DELAY = 300;
    const ANCHOR_EL: HTMLElement = this.resizeImg;

    let timer: number;
    const updatePosition = () => {
      // Update option position when scrolling
      const rect = ANCHOR_EL.getBoundingClientRect();
      this._optionPosition = {
        // when image size is too large, the option popup should show inside
        x: rect.width > 680 ? rect.right - 50 : rect.right + 12,
        y: Math.min(
          Math.max(rect.top, HEADER_HEIGHT + 12),
          rect.bottom - OPTION_ELEMENT_HEIGHT
        ),
      };
    };
    this.hoverState.on(hover => {
      clearTimeout(timer);
      if (hover) {
        updatePosition();
        return;
      }
      timer = window.setTimeout(() => {
        this._optionPosition = null;
      }, HOVER_DELAY);
    });
    this._disposables.addFromEvent(ANCHOR_EL, 'mouseover', e =>
      this.hoverState.emit(true)
    );
    this._disposables.addFromEvent(ANCHOR_EL, 'mouseleave', e =>
      this.hoverState.emit(false)
    );
    const viewportElement = getViewportElement(this.model.page);
    if (viewportElement) {
      this._disposables.addFromEvent(viewportElement, 'scroll', e => {
        if (!this._optionPosition) return;
        updatePosition();
      });
    }
  }

  private _imageOptionsTemplate() {
    if (!this._optionPosition) return null;
    return html`<affine-portal
      .template=${ImageOptionsTemplate({
        model: this.model,
        position: this._optionPosition,
        hoverState: this.hoverState,
      })}
    ></affine-portal>`;
  }

  override render() {
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
      <div class="affine-image-wrapper">
        <div class="resizable-img" style=${styleMap(resizeImgStyle)}>
          ${img} ${this._imageOptionsTemplate()}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-image': ImageBlockComponent;
  }
}

import './image/placeholder/loading-card.js';
import './image/placeholder/image-not-found.js';

import { Slot } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import { css, html, type PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { registerService } from '../__internal__/service.js';
import { getViewportElement } from '../__internal__/utils/query.js';
import { stopPropagation } from '../page-block/edgeless/utils.js';
import { ImageOptionsTemplate } from './image/image-options.js';
import type { ImageBlockModel } from './image-model.js';
import { ImageBlockService } from './image-service.js';

@customElement('affine-image')
export class ImageBlockComponent extends BlockElement<ImageBlockModel> {
  static maxRetryCount = 3;

  static override styles = css`
    affine-image {
      display: block;
    }
    .affine-embed-wrapper {
      text-align: center;
      margin-bottom: calc(var(--affine-paragraph-space) + 8px);
    }
    .affine-embed-wrapper-caption {
      width: 100%;
      font-size: var(--affine-font-sm);
      outline: none;
      border: 0;
      font-family: inherit;
      text-align: center;
      color: var(--affine-icon-color);
      display: none;
      background: var(--affine-background-primary-color);
    }
    .affine-embed-wrapper-caption::placeholder {
      color: var(--affine-placeholder-color);
    }

    .affine-embed-wrapper .caption-show {
      display: inline-block;
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

  @query('input')
  _input!: HTMLInputElement;

  @query('.resizable-img')
  public readonly resizeImg!: HTMLElement;

  @state()
  private _caption!: string;

  @state()
  private _source!: string;

  @state()
  private _imageState: 'waitUploaded' | 'loading' | 'ready' | 'failed' =
    'loading';

  @state()
  private _optionPosition: { x: number; y: number } | null = null;

  private _retryCount = 0;

  private hoverState = new Slot<boolean>();

  override connectedCallback() {
    super.connectedCallback();
    registerService('affine:image', ImageBlockService);
    this._imageState = 'loading';
    this._fetchImage();
    this._disposables.add(
      this.model.page.workspace.slots.blobUpdate.on(this._fetchImage)
    );
    // Wait for DOM to be ready
    setTimeout(() => this._observePosition());
  }

  override disconnectedCallback() {
    if (this._source) {
      URL.revokeObjectURL(this._source);
    }
    super.disconnectedCallback();
  }

  override firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);

    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
    // exclude padding and border width
    const { width, height } = this.model;

    if (width && height) {
      this.resizeImg.style.width = width + 'px';
      this.resizeImg.style.height = height + 'px';
    }

    this.updateComplete.then(() => {
      this._caption = this.model?.caption ?? '';

      if (this._caption.length > 0) {
        // Caption input should be toggled manually.
        // Otherwise it will be lost if the caption is deleted into empty state.
        this._input.classList.add('caption-show');
      }
    });

    // The embed block can not be focused,
    // so the active element will be the last activated element.
    // If the active element is the title textarea,
    // any event will dispatch from it and be ignored. (Most events will ignore title)
    // so we need to blur it.
    // See also https://developer.mozilla.org/en-US/docs/Web/API/Document/activeElement
    this.addEventListener('click', () => {
      if (
        document.activeElement &&
        document.activeElement instanceof HTMLElement
      ) {
        document.activeElement.blur();
      }
    });

    this._input.addEventListener('pointerup', (e: Event) => {
      e.stopPropagation();
    });
  }

  private _onInputChange() {
    this._caption = this._input.value;
    this.model.page.updateBlock(this.model, { caption: this._caption });
  }

  private _onInputBlur() {
    if (!this._caption) {
      this._input.classList.remove('caption-show');
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

  private _observePosition() {
    // At AFFiNE, avoid the option element to be covered by the header
    // we need to reserve the space for the header
    const HEADER_HEIGHT = 64;
    // The height of the option element
    // You need to change this value manually if you change the style of the option element
    const OPTION_ELEMENT_HEIGHT = 136;
    const HOVER_DELAY = 300;
    const ANCHOR_EL: HTMLElement = this.resizeImg;

    let hover = false;
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
    this.hoverState.on(newHover => {
      hover = newHover;
      clearTimeout(timer);
      if (hover) {
        updatePosition();
        return;
      }
      timer = window.setTimeout(() => {
        this._optionPosition = null;
      }, HOVER_DELAY);
    });
    this._disposables.addFromEvent(ANCHOR_EL, 'mouseover', () =>
      this.hoverState.emit(true)
    );
    this._disposables.addFromEvent(ANCHOR_EL, 'mouseleave', () =>
      this.hoverState.emit(false)
    );
    this._disposables.add(
      this.model.propsUpdated.on(() => {
        if (!hover) return;
        updatePosition();
      })
    );
    const viewportElement = getViewportElement(this.model.page);
    if (viewportElement) {
      this._disposables.addFromEvent(viewportElement, 'scroll', () => {
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

    return html`
      <div>
        <div class="affine-image-wrapper">
          <div class="resizable-img" style=${styleMap(resizeImgStyle)}>
            ${img} ${this._imageOptionsTemplate()}
          </div>
        </div>
      </div>
      <div class="affine-embed-block-container">
        <div class="affine-embed-wrapper">
          <input
            .disabled=${this.model.page.readonly}
            placeholder="Write a caption"
            class="affine-embed-wrapper-caption"
            value=${this._caption}
            @input=${this._onInputChange}
            @blur=${this._onInputBlur}
            @click=${stopPropagation}
          />
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

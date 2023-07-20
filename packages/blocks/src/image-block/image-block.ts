import './image/placeholder/loading-card.js';
import './image/placeholder/image-not-found.js';

import { Slot } from '@blocksuite/global/utils';
import { BlockElement, type FocusContext } from '@blocksuite/lit';
import { css, html, type PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { registerService } from '../__internal__/service.js';
import { clamp } from '../__internal__/utils/common.js';
import { stopPropagation } from '../__internal__/utils/event.js';
import { getViewportElement } from '../__internal__/utils/query.js';
import { ImageOptionsTemplate } from './image/image-options.js';
import { ImageResizeManager } from './image/image-resize-manager.js';
import { ImageSelectedRectsContainer } from './image/image-selected-rects.js';
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
      background: transparent;
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

    .resizable-img {
      position: relative;
      border: 1px solid var(--affine-white-90);
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

  @state()
  _focused = false;

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

    this._observeDrag();
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
  }

  override focusBlock(ctx: FocusContext) {
    super.focusBlock(ctx);
    if (ctx.multi) {
      return true;
    }
    this._focused = true;
    // show selection rect
    return false;
  }

  override blurBlock(ctx: FocusContext) {
    this._focused = false;
    super.blurBlock(ctx);
    return true;
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

  private _observeDrag() {
    const embedResizeManager = new ImageResizeManager();

    let dragging = false;
    this._disposables.add(
      this.root.uiEventDispatcher.add('dragStart', ctx => {
        const pointerState = ctx.get('pointerState');
        const target = pointerState.event.target;
        if (
          target &&
          target instanceof HTMLElement &&
          this.contains(target) &&
          target.classList.contains('resize')
        ) {
          dragging = true;
          embedResizeManager.onStart(pointerState);
          return true;
        }
        return false;
      })
    );
    this._disposables.add(
      this.root.uiEventDispatcher.add('dragMove', ctx => {
        const pointerState = ctx.get('pointerState');
        if (dragging) {
          embedResizeManager.onMove(pointerState);
          return true;
        }
        return false;
      })
    );
    this._disposables.add(
      this.root.uiEventDispatcher.add('dragEnd', ctx => {
        if (dragging) {
          dragging = false;
          embedResizeManager.onEnd();
          return true;
        }
        return false;
      })
    );
  }

  private _observePosition() {
    // At AFFiNE, avoid the option element to be covered by the header
    // we need to reserve the space for the header
    const HEADER_HEIGHT = 64;
    // The height of the option element
    // You need to change this value manually if you change the style of the option element
    const OPTION_ELEMENT_WEIGHT = 50;
    const OPTION_ELEMENT_HEIGHT = 136;
    const HOVER_DELAY = 300;
    const TOP_EDGE = 10;
    const LEFT_EDGE = 12;
    const ANCHOR_EL: HTMLElement = this.resizeImg;

    let isHover = false;
    let isClickHold = false;
    let timer: number;

    const updateOptionsPosition = () => {
      if (isClickHold) {
        this._optionPosition = null;
        return;
      }
      clearTimeout(timer);
      if (!isHover) {
        // delay hiding the option element
        timer = window.setTimeout(
          () => (this._optionPosition = null),
          HOVER_DELAY
        );
        if (!this._optionPosition) return;
      }
      // Update option position when scrolling
      const rect = ANCHOR_EL.getBoundingClientRect();
      const showInside =
        rect.width > 680 ||
        rect.right + LEFT_EDGE + OPTION_ELEMENT_WEIGHT > window.innerWidth;
      this._optionPosition = {
        x: showInside
          ? // when image size is too large, the option popup should show inside
            rect.right - OPTION_ELEMENT_WEIGHT
          : rect.right + LEFT_EDGE,
        y:
          rect.height < OPTION_ELEMENT_HEIGHT
            ? // when image size is too small,
              // the option popup should always show align with the top edge
              rect.top
            : clamp(
                rect.top + TOP_EDGE,
                Math.min(
                  HEADER_HEIGHT + LEFT_EDGE,
                  rect.bottom - OPTION_ELEMENT_HEIGHT - TOP_EDGE
                ),
                rect.bottom - OPTION_ELEMENT_HEIGHT - TOP_EDGE
              ),
      };
    };

    this.hoverState.on(newHover => {
      if (isHover === newHover) return;
      isHover = newHover;
      updateOptionsPosition();
    });
    this._disposables.addFromEvent(ANCHOR_EL, 'mouseover', () =>
      this.hoverState.emit(true)
    );
    this._disposables.addFromEvent(ANCHOR_EL, 'mouseleave', () =>
      this.hoverState.emit(false)
    );

    // When the resize handler is clicked, the image option should be hidden
    this._disposables.addFromEvent(this, 'pointerdown', () => {
      isClickHold = true;
      updateOptionsPosition();
    });
    this._disposables.addFromEvent(window, 'pointerup', () => {
      isClickHold = false;
      updateOptionsPosition();
    });

    this._disposables.add(
      this.model.propsUpdated.on(() => updateOptionsPosition())
    );
    const viewportElement = getViewportElement(this.model.page);
    if (viewportElement) {
      this._disposables.addFromEvent(viewportElement, 'scroll', () =>
        updateOptionsPosition()
      );
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

  private _imageResizeBoardTemplate() {
    const isFocused = this._focused;
    if (!isFocused || this._imageState !== 'ready') return null;
    return ImageSelectedRectsContainer();
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
      ready: html`<img src=${this._source} draggable="false" />`,
      failed: html`<affine-image-block-not-found-card></affine-image-block-not-found-card>`,
    }[this._imageState];

    return html`
      <div>
        <div class="affine-image-wrapper">
          <div class="resizable-img" style=${styleMap(resizeImgStyle)}>
            ${img} ${this._imageOptionsTemplate()}
            ${this._imageResizeBoardTemplate()}
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
            @pointerup=${stopPropagation}
            @paste=${stopPropagation}
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

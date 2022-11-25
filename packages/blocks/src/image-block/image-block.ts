import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import type { EmbedBlockModel } from '../embed-block';
import {
  BLOCK_ID_ATTR,
  type BlockHost,
  BlockChildrenContainer,
} from '../__internal__';
import style from './style.css';
import { DeleteIcon, DownloadIcon, CaptionIcon, CopyIcon } from './icons';

@customElement('img-block')
export class ImageBlockComponent extends LitElement {
  static styles = css`
    ${unsafeCSS(style)}
  `;

  @property({
    hasChanged() {
      return true;
    },
  })
  model!: EmbedBlockModel;

  @property()
  host!: BlockHost;

  @query('.top-left')
  _topLeft!: HTMLElement;

  @query('.affine-image-wrapper')
  _container!: HTMLElement;

  @query('.top-right')
  _topRight!: HTMLElement;

  @query('.bottom-left')
  _bottomLeft!: HTMLElement;

  @query('.bottom-right')
  _bottomRight!: HTMLElement;

  @query('.resizable')
  _resizable!: HTMLElement;

  @query('.affine-embed-wrapper-caption')
  _captionDom!: HTMLInputElement;

  @state()
  _canEditor!: boolean;

  @state()
  _optionLocation!: boolean;
  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  private maximumSize = 720;

  private containerWidth = 0;

  // This is the initial mouse position before event resize is applied.
  private originalMouseX = 0;

  // This is the initial width before event resize is applied
  private originalWidth = 0;

  private minimumSize = 20;

  private width = 0;

  private _startResizingLeft = (e: MouseEvent) => {
    // Prevent propagation of mousedown event that could lead to click / select of block).
    e.stopPropagation();
    this.originalMouseX = e.pageX;
    // bind to window just in case you drag outside of the block
    // for example, if you drag beyond the size of the block, we
    // want to continue hearing the mouse move changes.
    window.addEventListener('mousemove', this._handleResizeLeftMove);
    window.addEventListener('mouseup', this._commitResize);
  };

  private _startResizingRight = (e: MouseEvent) => {
    // Prevent propagation of mousedown event that could lead to click / select of block).
    e.stopPropagation();
    this.originalMouseX = e.pageX;
    window.addEventListener('mousemove', this._handleResizeRightMove);
    window.addEventListener('mouseup', this._commitResize);
  };

  private _removeResizeListeners = () => {
    window.removeEventListener('mousemove', this._handleResizeLeftMove);
    window.removeEventListener('mousemove', this._handleResizeRightMove);
  };

  // cancel resizing and revert to width before starting resize
  private _cancelResize = () => {
    this._setContainerWidthFromResizingEvent(this.originalWidth);
    this._removeResizeListeners();
  };

  // apply current width from resizing and update block
  private _commitResize = () => {
    this.originalWidth = this.width;
    this.model.space.updateBlock(this.model, { width: this.width });
    this._removeResizeListeners();
  };

  private _handleResizeLeftMove = (mouseMoveEvent: MouseEvent) => {
    mouseMoveEvent.preventDefault();
    const width =
      this.originalWidth - (mouseMoveEvent.pageX - this.originalMouseX);
    this._setContainerWidthFromResizingEvent(width);
  };

  private _handleResizeRightMove = (mouseMoveEvent: MouseEvent) => {
    mouseMoveEvent.preventDefault();
    const width =
      this.originalWidth + (mouseMoveEvent.pageX - this.originalMouseX);
    this._setContainerWidthFromResizingEvent(width);
  };

  private _setContainerWidthFromResizingEvent(width: number) {
    const isWidthWithinBounds =
      width > this.minimumSize && width < this.maximumSize;
    if (isWidthWithinBounds) {
      this.width = width;
      this._resizable.style.width = `${width}px`;
      this._optionLocation = width > this.containerWidth - 100;
    }
  }
  private _deleteBlock() {
    this.model.space.deleteBlock(this.model);
  }

  private async _copyBlock() {
    this._writeClipImg(this.model.source);
  }

  private async _writeClipImg(imgURL: string) {
    try {
      const data = await fetch(imgURL);
      const blob = await data.blob();

      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      console.log('Fetched image copied.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.name, err.message);
      }
    }
  }

  private _downloadImage() {
    const link = document.createElement('a');
    link.href = this.model.source;
    document.body.appendChild(link);
    link.download = 'test';
    link.click();
    document.body.removeChild(link);
    link.remove();
  }

  private _editorImageCaption() {
    this._captionDom.focus();
  }

  private _selectImage() {
    this._canEditor = true;
  }

  override firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
    // exclude padding and border width
    this.containerWidth = this._container.clientWidth - 100;
    const { source } = this.model;
    const img = new Image();
    img.src = source;
    img.onload = () => {
      this.originalWidth =
        img.width > this.containerWidth ? this.containerWidth : img.width;
      this._optionLocation = img.width > this.containerWidth;
      this.maximumSize = this.originalWidth;
      this._resizable.style.width = img.width + 'px';
      this._canEditor = true;
      this._topLeft.addEventListener('mousedown', this._startResizingLeft);
      this._topRight.addEventListener('mousedown', this._startResizingRight);
      this._bottomLeft.addEventListener('mousedown', this._startResizingLeft);
      this._bottomRight.addEventListener('mousedown', this._startResizingRight);
    };
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._cancelResize();
    this._topLeft.removeEventListener('mousedown', this._startResizingLeft);
    this._topRight.removeEventListener('mousedown', this._startResizingRight);
    this._bottomLeft.removeEventListener('mousedown', this._startResizingLeft);
    this._bottomRight.removeEventListener(
      'mousedown',
      this._startResizingRight
    );
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);
    // const { deep, index } = getListInfo(this.host, this.model);
    const childrenContainer = BlockChildrenContainer(this.model, this.host);
    const { source } = this.model;
    // For the first list item, we need to add a margin-top to make it align with the text
    // const shouldAddMarginTop = index === 0 && deep === 0;
    return html`
      <embed-block .model=${this.model}>
        <div
          class="affine-image-wrapper ${this._canEditor ? 'active' : ''}"
          @click=${this._selectImage}
        >
          <div
            class="resizable ${this._optionLocation
              ? 'image-option-inside'
              : ''}"
          >
            <div class="image-option-container">
              <ul class="image-option">
                <li @click=${this._editorImageCaption}>${CaptionIcon}</li>
                <li @click=${this._downloadImage}>${DownloadIcon}</li>
                <li @click=${this._copyBlock}>${CopyIcon}</li>
                <li @click=${this._deleteBlock}>${DeleteIcon}</li>
              </ul>
            </div>
            <div class="resizes">
              <!-- <div class="resize top-left"></div>
              <div class="resize top-right"></div>
              <div class="resize bottom-left"></div>
              <div class="resize bottom-right"></div> -->
              <!-- <div > -->
              <img src=${source} />
              <!-- </div> -->
            </div>
          </div>
          ${childrenContainer}
        </div>
      </embed-block>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'img-block': ImageBlockComponent;
  }
}

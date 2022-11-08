import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { EmbedBlockModel } from '../embed-block';
import {
  BLOCK_ID_ATTR,
  BlockHost,
  BlockChildrenContainer,
} from '../__internal__';
import style from './style.css';

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
  topLeft!: HTMLElement;

  @query('.top-right')
  topRight!: HTMLElement;

  @query('.bottom-left')
  bottomLeft!: HTMLElement;

  @query('.bottom-right')
  bottomRight!: HTMLElement;

  @query('.resizable')
  _container!: HTMLElement;

  block: any;
  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }
  private maximumSize: number = 720;
  /** This is the initial mouse position before event resize is applied. */
  private originalMouseX: number = 0;
  /** This is the initial width before event resize is applied */
  private originalWidth: number = 0;
  private minimumSize: number = 20;
  private width: number = 0;

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

  /** cancel resizing and revert to width before starting resize */
  private _cancelResize = () => {
    this._setContainerWidthFromResizingEvent(this.originalWidth);
    this._removeResizeListeners();
  };

  /** apply current width from resizing and update block */
  private _commitResize = () => {
    this.originalWidth = this.width;
    this.model.space.updateBlock(this.model, { width: this.width });
    this._removeResizeListeners();
  };

  private _handleResizeLeftMove = (mouseMoveEvent: MouseEvent) => {
    const width =
      this.originalWidth - (mouseMoveEvent.pageX - this.originalMouseX);
    this._setContainerWidthFromResizingEvent(width);
  };

  private _handleResizeRightMove = (mouseMoveEvent: MouseEvent) => {
    const width =
      this.originalWidth + (mouseMoveEvent.pageX - this.originalMouseX);
    this._setContainerWidthFromResizingEvent(width);
  };

  private _setContainerWidthFromResizingEvent(width: number) {
    const isWidthWithinBounds =
      width > this.minimumSize && width < this.maximumSize;
    if (isWidthWithinBounds) {
      this.width = width;
      this._container.style.width = `${width}px`;
    }
  }

  override firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
    const { source } = this.model;
    let img = new Image();
    img.src = source;
    img.onload = () => {
      this.originalWidth = img.width > 720 ? 720 : img.width;
      this.maximumSize = this.originalWidth;
      this._container.style.width = img.width + 'px';
      this.topLeft.addEventListener('mousedown', this._startResizingLeft);
      this.topRight.addEventListener('mousedown', this._startResizingRight);
      this.bottomLeft.addEventListener('mousedown', this._startResizingLeft);
      this.bottomRight.addEventListener('mousedown', this._startResizingRight);
    };
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._cancelResize();
    this.topLeft.removeEventListener('mousedown', this._startResizingLeft);
    this.topRight.removeEventListener('mousedown', this._startResizingRight);
    this.bottomLeft.removeEventListener('mousedown', this._startResizingLeft);
    this.bottomRight.removeEventListener('mousedown', this._startResizingRight);
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);
    // const { deep, index } = getListInfo(this.host, this.model);
    const childrenContainer = BlockChildrenContainer(this.model, this.host);
    const { source, caption } = this.model;
    // For the first list item, we need to add a margin-top to make it align with the text
    // const shouldAddMarginTop = index === 0 && deep === 0;
    return html`
      <embed-block caption=${caption}>
        <div class="affine-image-wrapper">
          <div class="resizable">
            <div class="image-option-container">
              <ul class="image-option">
                <li>1</li>
                <li>2</li>
                <li>3</li>
                <li>4</li>
              </ul>
            </div>
            <div class="resizes">
              <div class="resize top-left"></div>
              <div class="resize top-right"></div>
              <div class="resize bottom-left"></div>
              <div class="resize bottom-right"></div>
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

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

  @query('.resizable')
  resizable!: HTMLElement;

  @query('.top-left')
  topLeft!: HTMLElement;

  @query('.top-right')
  topRight!: HTMLElement;

  @query('.bottom-left')
  bottomLeft!: HTMLElement;

  @query('.bottom-right')
  bottomRight!: HTMLElement;

  @query('.resizable')
  container!: HTMLElement;

  block: any;
  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }
  private maximumSize: number = 720;
  private originalMouseX: number = 0;
  private originalWidth: number = 0;
  private minimumSize: number = 20;
  private width: number = 0;

  private handLeft = (e: MouseEvent) => {
    e.stopPropagation();
    this.originalMouseX = e.pageX;
    window.addEventListener('mousemove', this.resizeLeft);
    window.addEventListener('mouseup', this.stopResize);
  };

  private handRight = (e: MouseEvent) => {
    this.originalMouseX = e.pageX;
    e.stopPropagation();
    window.addEventListener('mousemove', this.resizeRight);
    window.addEventListener('mouseup', this.stopResize);
  };
  private stopResize = () => {
    this.originalMouseX = this.width;
    window.removeEventListener('mousemove', this.resizeLeft);
    window.removeEventListener('mousemove', this.resizeRight);
  };

  private resizeLeft = (e: MouseEvent) => {
    const width = this.originalWidth - (e.pageX - this.originalMouseX);
    console.log(' this.originalWidth: ', this.originalWidth);
    if (width > this.minimumSize && width < this.maximumSize) {
      this.width = width;
      // @ts-ignore
      this.container.style.width = `${width}px`;
      // this.originalWidth = width;
    }
  };
  private resizeRight = (e: MouseEvent) => {
    const width = this.originalWidth + (e.pageX - this.originalMouseX);
    if (width > this.minimumSize && width < this.maximumSize) {
      this.width = width;
      // @ts-ignore
      this.container.style.width = `${width}px`;

      // ;
    }
  };

  async firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
    const { source } = this.model;
    let img = new Image();
    img.src = source;
    img.onload = () => {
      this.originalWidth = img.width > 720 ? 720 : img.width;
      this.maximumSize = this.originalWidth;
      this.container.style.width = img.width + 'px';
      this.topLeft.addEventListener('mousedown', this.handLeft);
      this.topRight.addEventListener('mousedown', this.handRight);
      this.bottomLeft.addEventListener('mousedown', this.handLeft);
      this.bottomRight.addEventListener('mousedown', this.handRight);
    };
  }

  disconnectedCallback() {
    this.stopResize();
    this.topLeft.removeEventListener('mousedown', this.handLeft);
    this.topRight.removeEventListener('mousedown', this.handRight);
    this.bottomLeft.removeEventListener('mousedown', this.handLeft);
    this.bottomRight.removeEventListener('mousedown', this.handRight);
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);
    // const { deep, index } = getListInfo(this.host, this.model);
    const childrenContainer = BlockChildrenContainer(this.model, this.host);

    const { source } = this.model;

    // For the first list item, we need to add a margin-top to make it align with the text
    // const shouldAddMarginTop = index === 0 && deep === 0;
    return html`
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
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'img-block': ImageBlockComponent;
  }
}

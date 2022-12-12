import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import type { EmbedBlockModel } from '../embed-block';
import {
  BLOCK_ID_ATTR,
  type BlockHost,
  BlockChildrenContainer,
} from '../__internal__';
import style from './style.css';

@customElement('img-block')
export class ImageBlockComponent extends LitElement {
  static styles = css`
    ${unsafeCSS(style)}
  `;

  model!: EmbedBlockModel;

  @property()
  host!: BlockHost;

  @query('.resizable-img')
  _resizeImg!: HTMLElement;

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  // This is the initial width before event resize is applied

  override firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
    // exclude padding and border width
    const { width, height } = this.model;
    if (width && height) {
      this._resizeImg.style.width = width + 'px';
      this._resizeImg.style.height = height + 'px';
    }
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);
    const childrenContainer = BlockChildrenContainer(this.model, this.host);
    const { source, width, height } = this.model;

    if (width && height && this._resizeImg) {
      this._resizeImg.style.width = width + 'px';
      this._resizeImg.style.height = height + 'px';
    }
    // For the first list item, we need to add a margin-top to make it align with the text
    // const shouldAddMarginTop = index === 0 && deep === 0;
    return html`
      <embed-block .model=${this.model}>
        <div class="affine-image-wrapper">
          <div>
            <img class="resizable-img" src=${source} />
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

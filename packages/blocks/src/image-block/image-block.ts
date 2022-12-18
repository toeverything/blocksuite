import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import type { EmbedBlockModel } from '../embed-block';
import {
  BLOCK_ID_ATTR,
  type BlockHost,
  BlockChildrenContainer,
  assertExists,
} from '../__internal__';
import style from './style.css';

@customElement('affine-image')
export class ImageBlockComponent extends LitElement {
  static styles = css`
    ${unsafeCSS(style)}
  `;

  model!: EmbedBlockModel;

  @property()
  host!: BlockHost;

  @query('.resizable-img')
  _resizeImg!: HTMLElement;

  @state()
  _source!: string;
  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  // This is the initial width before event resize is applied

  override async firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
    // exclude padding and border width
    const { width, height } = this.model;
    const storage = await this.model.page.blobs;
    assertExists(storage);
    const url = await storage.get(this.model.sourceId);
    url && (this._source = url);
    if (width && height) {
      this._resizeImg.style.width = width + 'px';
      this._resizeImg.style.height = height + 'px';
    }
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);
    const childrenContainer = BlockChildrenContainer(this.model, this.host);
    const { width, height } = this.model;

    if (width && height && this._resizeImg) {
      this._resizeImg.style.width = width + 'px';
      this._resizeImg.style.height = height + 'px';
    }
    // For the first list item, we need to add a margin-top to make it align with the text
    // const shouldAddMarginTop = index === 0 && deep === 0;
    return html`
      <embed-block .model=${this.model} .readonly=${this.host.readonly}>
        <div class="affine-image-wrapper">
          <div>
            <img class="resizable-img" src=${this._source} />
          </div>
          ${childrenContainer}
        </div>
      </embed-block>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-image': ImageBlockComponent;
  }
}

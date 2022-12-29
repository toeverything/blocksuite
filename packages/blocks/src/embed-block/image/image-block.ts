import { html, css, unsafeCSS } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import type { EmbedBlockModel } from '../index.js';
import {
  BLOCK_ID_ATTR,
  type BlockHost,
  assertExists,
  NonShadowLitElement,
  BlockChildrenContainerWithService,
} from '../../__internal__/index.js';
import style from './style.css?inline';

@customElement('affine-image')
export class ImageBlockComponent extends NonShadowLitElement {
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
    const childrenContainer = BlockChildrenContainerWithService(
      this.model,
      this.host,
      () => this.requestUpdate()
    );
    const { width, height } = this.model;

    if (width && height && this._resizeImg) {
      this._resizeImg.style.width = width + 'px';
      this._resizeImg.style.height = height + 'px';
    }
    // For the first list item, we need to add a margin-top to make it align with the text
    // const shouldAddMarginTop = index === 0 && deep === 0;
    return html`
      <affine-embed .model=${this.model} .readonly=${this.host.readonly}>
        <div class="affine-image-wrapper">
          <div>
            <img class="resizable-img" src=${this._source} />
          </div>
          ${childrenContainer}
        </div>
      </affine-embed>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-image': ImageBlockComponent;
  }
}

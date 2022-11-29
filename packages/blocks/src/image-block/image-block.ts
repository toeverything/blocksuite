import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
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

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  // This is the initial width before event resize is applied

  private _selectImage() {
    this._canEditor = true;
  }

  override firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
    // exclude padding and border width
    const { source } = this.model;
    const img = new Image();
    img.src = source;
    // img.onload = () => {};
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    // this._cancelResize();
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
        <div class="affine-image-wrapper" @click=${this._selectImage}>
          <div class="resizable">
            <img src=${source} />
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

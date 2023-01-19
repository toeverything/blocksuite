import { html, css } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import type { EmbedBlockModel } from '../index.js';
import {
  BLOCK_ID_ATTR,
  type BlockHost,
  NonShadowLitElement,
  BlockChildrenContainer,
} from '../../__internal__/index.js';
import { assertExists } from '@blocksuite/global/utils';

@customElement('affine-image')
export class ImageBlockComponent extends NonShadowLitElement {
  static styles = css`
    .affine-image-wrapper {
      padding: 8px;
      width: 100%;
      text-align: center;
      line-height: 0;
    }
    .affine-image-wrapper img {
      max-width: 100%;
      margin: auto;
      width: 100%;
    }

    .resizable {
      max-width: 100%;
      /* text-align: center; */
    }
    /* .resizable:hover {
      border: 2px solid #4286f4;
    } */
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
      box-shadow: 0px 1px 10px -6px rgba(24, 39, 75, 0.8),
        0px 3px 16px -6px rgba(24, 39, 75, 0.4);
      border-radius: 10px;
      list-style: none;
      padding: 4px;
      width: 40px;
      background-color: var(--affine-page-background);
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
      border: 1px solid var(--affine-page-background);
    }
    .resizable-img:hover {
      border: 1px solid var(--affine-primary-color);
    }
  `;

  @property({ hasChanged: () => true })
  model!: EmbedBlockModel;

  @property()
  host!: BlockHost;

  @query('.resizable-img')
  private _resizeImg!: HTMLElement;

  @state()
  private _source!: string;

  async firstUpdated() {
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
    const childrenContainer = BlockChildrenContainer(
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

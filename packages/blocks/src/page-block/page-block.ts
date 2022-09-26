import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { BLOCK_ID_ATTR, type BlockHost } from '@blocksuite/shared';
import { PageBlockModel } from './page-model';
import { focusTextEnd, getBlockChildrenContainer } from '../__internal__/utils';

@customElement('page-block-element')
export class PageBlockElement extends LitElement {
  @property()
  host!: BlockHost;

  @property({
    hasChanged() {
      return true;
    },
  })
  model!: PageBlockModel;

  @query('.affine-page-block-title')
  _blockTitle!: HTMLInputElement;

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.model.propsUpdated.on(() => {
      if (this.model.title !== this._blockTitle.value) {
        this.requestUpdate();
      }
    });

    focusTextEnd(this._blockTitle);
  }

  private _onTitleInput(e: InputEvent) {
    const { store } = this.host;

    if (!this.model.id) {
      const title = (e.target as HTMLInputElement).value;
      store.addBlock({ flavour: 'page', title });
      store.addBlock({ flavour: 'paragraph' });
      return;
    }

    const title = (e.target as HTMLInputElement).value;
    store.updateBlock(this.model, { title });
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const childrenContainer = getBlockChildrenContainer(this.model, this.host);

    return html`
      <style>
        .affine-page-block-title {
          box-sizing: border-box;
          font-size: 32px;
          font-weight: 600;
          outline: none;
          border: 0;
        }
        .affine-page-block-title::placeholder {
          color: #ddd;
        }
        .affine-page-block-container > .affine-block-children-container {
          padding-left: 0;
        }
      </style>
      <div class="affine-page-block-container">
        <div class="affine-page-block-title-container">
          <input
            placeholder="Title"
            class="affine-page-block-title"
            value=${this.model.title}
            @input=${this._onTitleInput}
          />
        </div>
        ${childrenContainer}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-block-element': PageBlockElement;
  }
}

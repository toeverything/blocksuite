import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { Store } from '@building-blocks/store';
import { PageBlockModel, BLOCK_ID_ATTR } from '../';
import { PageContainer } from '../types';
import { getBlockChildrenContainer } from '../__internal__/utils';

@customElement('page-block-element')
export class PageBlockElement extends LitElement {
  @property()
  store!: Store;

  @property()
  page!: PageContainer;

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

    this._blockTitle.focus();
  }

  private _onTitleInput(e: InputEvent) {
    const title = (e.target as HTMLInputElement).value;
    this.store.updateBlock(this.model, { title });
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const childrenContainer = getBlockChildrenContainer(this.model, this.page);

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

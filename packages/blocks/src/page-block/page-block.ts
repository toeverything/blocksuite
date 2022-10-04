import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import {
  asyncFocusRichText,
  BLOCK_ID_ATTR,
  type BlockHost,
} from '@blocksuite/shared';
import type { PageBlockModel } from './page-model';
import { focusTextEnd, getBlockChildrenContainer } from '../__internal__/utils';

@customElement('default-page-block')
export class DefaultPageBlockComponent extends LitElement {
  @property()
  host!: BlockHost;

  @property({
    hasChanged() {
      return true;
    },
  })
  model!: PageBlockModel;

  @query('.affine-default-page-block-title')
  _blockTitle!: HTMLInputElement;

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.model.propsUpdated.on(() => {
      if (this.model.title !== this._blockTitle.value) {
        this._blockTitle.value = this.model.title || '';
        this.requestUpdate();
      }
    });

    focusTextEnd(this._blockTitle);
  }

  private _onKeyDown(e: KeyboardEvent) {
    const hasContent = this._blockTitle.value.length > 0;

    if (e.key === 'Enter' && hasContent) {
      asyncFocusRichText(this.host.store, this.model.children[0].id);
    }
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
        .affine-default-page-block-title {
          box-sizing: border-box;
          font-size: 32px;
          font-weight: 600;
          outline: none;
          border: 0;
        }
        .affine-default-page-block-title::placeholder {
          color: #ddd;
        }
        .affine-default-page-block-container
          > .affine-block-children-container {
          padding-left: 0;
        }
      </style>
      <div class="affine-default-page-block-container">
        <div class="affine-default-page-block-title-container">
          <input
            placeholder="Title"
            class="affine-default-page-block-title"
            value=${this.model.title}
            @keydown=${this._onKeyDown}
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
    'default-page-block': DefaultPageBlockComponent;
  }
}
